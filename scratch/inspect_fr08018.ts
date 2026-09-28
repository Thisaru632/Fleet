const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function inspectFR08018() {
  await dbConnect();
  const trip = await Trip.findOne({ reference: 'FR08018' }, { images: 0 }).lean();
  console.log('=== TRIP FR08018 (NO IMAGES) ===');
  console.log(JSON.stringify(trip, null, 2));

  console.log('\n=== rawValues index by index for FR08018 ===');
  trip.rawValues.forEach((val, idx) => {
    console.log(`[${idx}]: ${JSON.stringify(val)}`);
  });

  const tripImages = await Trip.findOne({ reference: 'FR08018' }, { 'images.name': 1 }).lean();
  console.log('\n=== Image Names in FR08018 ===');
  console.log(tripImages.images.map(img => img.name));

  process.exit(0);
}

inspectFR08018().catch((err) => {
  console.error(err);
  process.exit(1);
});
