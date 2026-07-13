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
  
  // Trip 3 (Bottom, FR07170)
  const trip3Raw = [
    "Pending", "FR07170", "2026-07-11 8:11:39", "SCD001", "PK-3991", "Personal",
    100108, "", "", 0, "", 0, "", 0, 0, 0, 0, 0, 0, 0
  ];
  const trip3 = new Trip({
    status: "Pending", reference: "FR07170", timestamp: "2026-07-11 8:11:39",
    driverId: "SCD001", vehicle: "PK-3991", purpose: "Personal",
    fuel: 0, repair: 0, scDue: 0, commission: 0, mileage: 0, finalPrice: 0,
    rawValues: trip3Raw
  });

  // Trip 2 (Middle, FR07171)
  const trip2Raw = [
    "Pending", "FR07171", "2026-07-12 6:55:17", "SCD026", "PK-3991", "Hire",
    100109, "2026-07-12 20:09:40", 100287, 0, "Mishara", 0, "20260778141",
    12668, 3167, 100118, 100278, 0, 9, 9
  ];
  const trip2 = new Trip({
    status: "Pending", reference: "FR07171", timestamp: "2026-07-12 6:55:17",
    driverId: "SCD026", vehicle: "PK-3991", purpose: "Hire",
    fuel: 0, repair: 0, scDue: 12668, commission: 3167, mileage: 0, finalPrice: 0,
    rawValues: trip2Raw
  });

  // Trip 1 (Top, FR07172)
  const trip1Raw = [
    "Pending", "FR07172", "2026-07-12 20:16:50", "SCD026", "PK-3991", "Personal",
    100287, "2026-07-12 20:35:34", 100290, 12420, "Mishara", 0, "",
    0, 0, 0, 0, 0, 0, 0
  ];
  const trip1 = new Trip({
    status: "Pending", reference: "FR07172", timestamp: "2026-07-12 20:16:50",
    driverId: "SCD026", vehicle: "PK-3991", purpose: "Personal",
    fuel: 12420, repair: 0, scDue: 0, commission: 0, mileage: 0, finalPrice: 0,
    rawValues: trip1Raw
  });

  // Save all
  await trip3.save();
  console.log('Saved FR07170');
  await trip2.save();
  console.log('Saved FR07171');
  await trip1.save();
  console.log('Saved FR07172');

  console.log('Successfully inserted all 3 records!');
  await mongoose.disconnect();
}

run().catch(console.error);
