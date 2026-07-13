import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const tripSchema = new mongoose.Schema({
  status: { type: String, default: "Pending" },
  reference: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  driverId: { type: String, required: true },
  vehicle: { type: String },
  purpose: { type: String },
  fuel: { type: Number, default: 0 },
  repair: { type: Number, default: 0 },
  scDue: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  mileage: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  rawValues: { type: [mongoose.Schema.Types.Mixed] }, 
}, { strict: false });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

async function run() {
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB');
  
  const lastTrip = await Trip.findOne({ reference: /^FR/ }).sort({ reference: -1 });
  let nextNumber = 1;
  if (lastTrip && lastTrip.reference) {
    nextNumber = parseInt(lastTrip.reference.slice(2)) + 1;
  }
  
  console.log(`The next available reference number is: FR${String(nextNumber).padStart(5, "0")}`);
  
  await mongoose.disconnect();
}

run().catch(console.error);
