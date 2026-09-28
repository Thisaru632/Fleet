const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function checkPersonalAndPending() {
  await dbConnect();
  
  console.log('=== PENDING PERSONAL TRIPS (or any newly created trips) ===');
  const trips = await Trip.find({
    $or: [
      { 'rawValues.7': '' },
      { 'rawValues.7': null },
      { 'rawValues.8': '' },
      { 'rawValues.8': null }
    ]
  }).sort({ timestamp: -1 }).limit(5).lean();

  for (const t of trips) {
    console.log(`\nRef: ${t.reference}, purpose: ${t.purpose}, status: ${t.status}`);
    console.log('top-level fields:', {
      mileage: t.mileage,
      finalPrice: t.finalPrice,
      commission: t.commission,
      scDue: t.scDue,
      fuel: t.fuel,
      repair: t.repair,
      imagesCount: t.images?.length,
      imageNames: t.images?.map(i => i.name)
    });
    console.log('rawValues:');
    t.rawValues.forEach((val, idx) => {
      if (val !== "" && val !== null && val !== undefined) {
        console.log(`  [${idx}]: "${val}"`);
      }
    });
  }
  process.exit(0);
}

checkPersonalAndPending().catch(console.error);
