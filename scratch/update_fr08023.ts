const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function updateFR08023() {
  await dbConnect();

  const trip = await Trip.findOne({ reference: 'FR08023' });
  if (!trip) {
    console.error('Error: Trip FR08023 not found in database!');
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
  // [1]: FR08023
  // [2]: 2026-09-26 18:39:21 (Start TS)
  // [3]: SCD023 (Driver)
  // [4]: CBK-0647 (Vehicle)
  // [5]: Personal (Purpose)
  // [6]: 204537 (Garage Start Meter)
  // [29]: https://maps.google.com/?q=6.9083903,79.9414692 (Start Location)

  // Remove garage end details:
  updatedRawValues[7] = '';  // Garage End Timestamp
  updatedRawValues[8] = '';  // Garage End Meter
  updatedRawValues[10] = ''; // Comments entered at end
  updatedRawValues[22] = ''; // Total Mileage
  updatedRawValues[30] = ''; // End Location

  // Keep images only up to start images (remove GarageEnd image)
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
  const updatedTrip = await Trip.findOne({ reference: 'FR08023' });
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

  process.exit(0);
}

updateFR08023().catch((err) => {
  console.error('Update error:', err);
  process.exit(1);
});
