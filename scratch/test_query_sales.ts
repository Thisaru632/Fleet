import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  await mongoose.connect(uri);

  const tripSchema = new mongoose.Schema({}, { strict: false });
  const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

  // Exact query from /api/admin/sales/route.ts
  const fleetQuery = {
    status: { $not: /cancel/i },
    "rawValues.0": { $not: /cancel/i }
  };

  const tripsForPage = await Trip.find(fleetQuery, { images: 0 }).sort({ timestamp: -1 }).limit(100).lean();

  const fleetData = tripsForPage.map((trip: any) => ({
    rf: trip.reference,
    date: trip.rawValues?.[7] || trip.timestamp,
    driver: trip.driverId,
    vehicle: trip.vehicle,
    purpose: trip.purpose,
    status: trip.status,
    values: trip.rawValues || [],
  }));

  console.log("Total trips returned:", fleetData.length);

  const idx662 = fleetData.findIndex((r: any) => r.rf === 'FR07662');
  const idx663 = fleetData.findIndex((r: any) => r.rf === 'FR07663');
  const idx661 = fleetData.findIndex((r: any) => r.rf === 'FR07661');

  console.log("FR07662 index:", idx662, idx662 !== -1 ? fleetData[idx662] : 'Not found');
  console.log("FR07663 index:", idx663, idx663 !== -1 ? fleetData[idx663] : 'Not found');
  console.log("FR07661 index:", idx661, idx661 !== -1 ? fleetData[idx661] : 'Not found');

  if (idx662 !== -1 && idx663 !== -1) {
    console.log("SUCCESS: Is FR07663 immediately after FR07662?", idx663 === idx662 + 1);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
