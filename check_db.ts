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
}, { strict: false });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

async function run() {
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB');
  
  const trips = await Trip.find({ reference: { $gte: 'FR07160' } }).sort({ reference: 1 }).limit(10);
  console.log('Trips around FR07160:');
  trips.forEach(t => console.log(t.reference));
  
  await mongoose.disconnect();
}

run().catch(console.error);
