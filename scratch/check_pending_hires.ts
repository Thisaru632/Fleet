import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB");

  const trips = await db.collection('trips').find({ 
    purpose: 'Hire',
    reference: { $gte: 'FR07660' }
  }).sort({ reference: 1 }).toArray();

  trips.forEach(t => {
    console.log(`--- ${t.reference} ---`);
    console.log("DB Fields:", {
      status: t.status,
      reference: t.reference,
      timestamp: t.timestamp,
      driverId: t.driverId,
      vehicle: t.vehicle,
      purpose: t.purpose,
      fuel: t.fuel,
      repair: t.repair,
      scDue: t.scDue,
      commission: t.commission,
      mileage: t.mileage,
      finalPrice: t.finalPrice,
    });
    console.log("rawValues length:", t.rawValues?.length);
    console.log("rawValues:", t.rawValues);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
