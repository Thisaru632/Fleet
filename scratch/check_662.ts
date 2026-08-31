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
    reference: { $gte: 'FR07660', $lte: 'FR07665' } 
  }).sort({ reference: 1 }).toArray();

  console.log("Found trips around FR07662:", trips.length);
  trips.forEach(t => {
    console.log(JSON.stringify({
      _id: t._id,
      ref: t.reference,
      status: t.status,
      driverId: t.driverId,
      timestamp: t.timestamp,
      vehicle: t.vehicle,
      purpose: t.purpose,
      garageStart: t.garageStart || (t.rawValues ? t.rawValues[6] : undefined),
      rawValues: t.rawValues
    }, null, 2));
  });

  await mongoose.disconnect();
}

main().catch(console.error);
