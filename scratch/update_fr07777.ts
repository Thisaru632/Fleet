const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function updateFR07777() {
  await dbConnect();

  const trip = await Trip.findOne({ reference: 'FR07777' });
  if (!trip) {
    console.log('Error: Trip FR07777 not found');
    process.exit(1);
  }

  console.log('--- BEFORE UPDATE ---');
  console.log('status:', trip.status);
  console.log('rawValues[0]:', trip.rawValues[0]);
  console.log('rawValues[7] (Garage End TS):', trip.rawValues[7]);
  console.log('rawValues[8] (Garage End Meter):', trip.rawValues[8]);

  // Update status to Pending
  trip.status = 'Pending';
  
  // Clone rawValues and remove garage end details
  const updatedRaw = [...trip.rawValues];
  updatedRaw[0] = 'Pending';
  updatedRaw[7] = ''; // Garage end timestamp removed
  updatedRaw[8] = ''; // Garage end meter cleared/empty

  trip.rawValues = updatedRaw;
  trip.markModified('rawValues');

  await trip.save();

  console.log('\n--- AFTER UPDATE ---');
  const updatedTrip = await Trip.findOne({ reference: 'FR07777' }).lean();
  console.log('status:', updatedTrip.status);
  console.log('rawValues[0]:', updatedTrip.rawValues[0]);
  console.log('rawValues[2] (Garage Start TS):', updatedTrip.rawValues[2]);
  console.log('rawValues[6] (Garage Start Meter):', updatedTrip.rawValues[6]);
  console.log('rawValues[7] (Garage End TS):', updatedTrip.rawValues[7]);
  console.log('rawValues[8] (Garage End Meter):', updatedTrip.rawValues[8]);
  console.log('driverId:', updatedTrip.driverId);
  console.log('vehicle:', updatedTrip.vehicle);

  process.exit(0);
}

updateFR07777().catch((err: any) => {
  console.error('Update error:', err);
  process.exit(1);
});

export {};
