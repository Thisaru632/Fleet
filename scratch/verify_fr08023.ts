const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function verifyAppFlow() {
  await dbConnect();

  console.log('=== VERIFYING PENDING TRIPS FOR SCD023 ===');
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

  console.log('Pending FR Refs for driver SCD023:', frRefs);
  const includesFR08023 = frRefs.includes('FR08023');
  console.log('Does driver SCD023 have FR08023 in pending trips?', includesFR08023 ? '✅ YES' : '❌ NO');

  console.log('\n=== VERIFYING DETAILS FOR FR08023 ===');
  const trip = await Trip.findOne({ reference: 'FR08023' });
  const details = trip.rawValues;
  console.log('Start Timestamp (details[2]):', details[2]);
  console.log('Driver (details[3]):', details[3]);
  console.log('Vehicle (details[4]):', details[4]);
  console.log('Purpose (details[5]):', details[5]);
  console.log('Garage Start Meter (details[6]):', details[6]);
  console.log('Garage End Timestamp (details[7]):', details[7] === '' ? 'Cleared (Empty)' : details[7]);
  console.log('Garage End Meter (details[8]):', details[8] === '' ? 'Cleared (Empty)' : details[8]);
  console.log('Total Mileage (details[22]):', details[22] === '' ? 'Cleared (Empty)' : details[22]);
  console.log('Top-level trip mileage:', trip.mileage);
  console.log('Images attached:', trip.images.map((img: any) => img.name));

  process.exit(0);
}

verifyAppFlow().catch(console.error);
