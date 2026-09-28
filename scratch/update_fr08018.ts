const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function updateFR08018() {
  await dbConnect();

  const trip = await Trip.findOne({ reference: 'FR08018' });
  if (!trip) {
    console.error('Error: Trip FR08018 not found in database!');
    process.exit(1);
  }

  console.log('================ BEFORE UPDATE ================');
  console.log('Reference:', trip.reference);
  console.log('Status:', trip.status);
  console.log('Driver ID:', trip.driverId);
  console.log('Vehicle:', trip.vehicle);
  console.log('Purpose:', trip.purpose);
  console.log('Mileage:', trip.mileage);
  console.log('Images:', trip.images.map((i: any) => i.name));
  console.log('rawValues:');
  trip.rawValues.forEach((val: any, idx: number) => {
    console.log(`  [${idx}]: ${JSON.stringify(val)}`);
  });

  // Prepare updated rawValues
  const updatedRawValues = [...trip.rawValues];
  updatedRawValues[0] = 'Pending';
  // Keep start details:
  // [1]: FR08018
  // [2]: 2026-09-26 09:28:47 (Start TS)
  // [3]: SCD023 (Driver)
  // [4]: CBK-0647 (Vehicle)
  // [5]: Hire (Purpose)
  // [6]: 204350 (Garage Start Meter)
  // [9]: 10374 (Fuel Cost)
  // [12]: 20260982293 (Trip Ref)
  // [28]: 9/26/2026, 6:23:48 PM (Fuel Update TS)
  // [29]: https://maps.google.com/?q=6.9048167,79.9447637 (Start Location)
  // [31]: https://maps.google.com/?q=6.9084355,79.9391963 (1st Fuel Location)
  // [32]: Office card (1st Payment Type)

  // Remove garage end details:
  updatedRawValues[7] = '';  // Garage End Timestamp
  updatedRawValues[8] = '';  // Garage End Meter
  // For comments [10], preserve the fuel details string while removing the end-trip text ("Sampath")
  const currentComment = String(updatedRawValues[10] || '');
  const fuelMatch = currentComment.match(/\(Fuel - .*?\)/);
  updatedRawValues[10] = fuelMatch ? fuelMatch[0] : '';
  updatedRawValues[22] = ''; // Total Mileage
  updatedRawValues[30] = ''; // Garage End Location

  // Keep images except GarageEnd image
  const updatedImages = (trip.images || []).filter((img: any) => !img.name.includes('GarageEnd') && !img.name.includes('Garage_End'));

  // Update trip model
  trip.status = 'Pending';
  trip.mileage = 0;
  trip.rawValues = updatedRawValues;
  trip.images = updatedImages;

  trip.markModified('rawValues');
  trip.markModified('images');

  await trip.save();

  console.log('\n================ AFTER UPDATE ================');
  const updatedTrip = await Trip.findOne({ reference: 'FR08018' });
  console.log('Reference:', updatedTrip.reference);
  console.log('Status:', updatedTrip.status);
  console.log('Driver ID:', updatedTrip.driverId);
  console.log('Vehicle:', updatedTrip.vehicle);
  console.log('Purpose:', updatedTrip.purpose);
  console.log('Mileage:', updatedTrip.mileage);
  console.log('Images:', updatedTrip.images.map((i: any) => i.name));
  console.log('rawValues:');
  updatedTrip.rawValues.forEach((val: any, idx: number) => {
    console.log(`  [${idx}]: ${JSON.stringify(val)}`);
  });

  // Verification step for app logic
  const tripsInDb = await Trip.find(
    { driverId: { $regex: new RegExp(`^SCD023$`, 'i') } },
    { images: 0 },
    { sort: { updatedAt: -1 } }
  ).lean();

  const frRefs = tripsInDb
    .filter((t: any) => {
      const status = (t.status || '').toLowerCase();
      if (status === 'cancelled' || status === 'approved') return false;
      const garageEnd = t.rawValues ? t.rawValues[8] : '';
      return garageEnd === undefined || garageEnd === null || garageEnd === '';
    })
    .map((t: any) => t.reference);

  console.log('\nPending FR Refs for driver SCD023:', frRefs);
  console.log('Does driver SCD023 have FR08018 in pending trips?', frRefs.includes('FR08018') ? '✅ YES' : '❌ NO');

  process.exit(0);
}

updateFR08018().catch((err) => {
  console.error('Update error:', err);
  process.exit(1);
});
