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
  folderUrl: { type: String },
  folderId: { type: String },
  images: { type: [{ name: String, dataUrl: String }], default: [] },
  rawValues: { type: [mongoose.Schema.Types.Mixed] }, 
}, { timestamps: true });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

async function run() {
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB');
  
  // Check if it already exists
  const existing = await Trip.findOne({ reference: 'FR07162' });
  if (existing) {
    console.log('FR07162 already exists! Aborting.');
    await mongoose.disconnect();
    return;
  }
  
  const rawValues = [
    "Pending", // 0
    "FR07162", // 1
    "2026-07-12 20:19:26", // 2
    "SCD012", // 3
    "NE-3601", // 4
    "Repair", // 5
    45561, // 6
    "2026-07-12 22:38:00", // 7
    45572, // 8
    0, // 9
    "Roshan", // 10
    250, // 11
    "", // 12
    0, // 13
    0, // 14
    0, // 15
    0, // 16
    0, // 17
    0, // 18
    0 // 19
  ];
  
  const newTrip = new Trip({
    status: "Pending",
    reference: "FR07162",
    timestamp: "2026-07-12 20:19:26",
    driverId: "SCD012",
    vehicle: "NE-3601",
    purpose: "Repair",
    fuel: 0,
    repair: 250,
    scDue: 0,
    commission: 0,
    mileage: 0,
    finalPrice: 0,
    rawValues: rawValues
  });
  
  await newTrip.save();
  console.log('Successfully inserted FR07162!');
  
  await mongoose.disconnect();
}

run().catch(console.error);
