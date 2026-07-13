import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const tripSchema = new mongoose.Schema({
  reference: String,
  rawValues: [mongoose.Schema.Types.Mixed]
}, { strict: false });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

async function run() {
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB');
  
  // Find all trips >= FR07162, sorted in DESCENDING order to avoid collision when incrementing
  const trips = await Trip.find({ reference: { $gte: 'FR07162' } }).sort({ reference: -1 });
  
  console.log(`Found ${trips.length} trips to shift.`);
  
  for (const trip of trips) {
    const oldRef = trip.reference;
    // FR07162 -> prefix "FR", number "07162"
    const prefix = oldRef.slice(0, 2);
    const numStr = oldRef.slice(2);
    
    // Parse as integer, then +1
    const newNum = parseInt(numStr, 10) + 1;
    // Pad back to same length
    const newRef = prefix + String(newNum).padStart(numStr.length, '0');
    
    console.log(`Updating ${oldRef} -> ${newRef}`);
    
    trip.reference = newRef;
    
    // Update rawValues array if it contains the old reference
    if (trip.rawValues && Array.isArray(trip.rawValues)) {
      const newRaw = [...trip.rawValues];
      // Usually it's at index 1
      if (newRaw[1] === oldRef) {
        newRaw[1] = newRef;
      }
      
      // Also check if it appears anywhere else just in case
      for (let i = 0; i < newRaw.length; i++) {
        if (newRaw[i] === oldRef) {
          newRaw[i] = newRef;
        }
      }
      trip.rawValues = newRaw;
    }
    
    // We must use a direct update to avoid any schema validation issues on rawValues
    await Trip.updateOne({ _id: trip._id }, {
      $set: {
        reference: trip.reference,
        rawValues: trip.rawValues
      }
    });
  }
  
  console.log('Successfully shifted all records! FR07162 is now completely empty and available for insertion.');
  await mongoose.disconnect();
}

run().catch(console.error);
