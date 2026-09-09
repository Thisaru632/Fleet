const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function inspectFR07777() {
  await dbConnect();
  const trip = await Trip.findOne({ reference: 'FR07777' }).lean();
  if (!trip) {
    console.log("Not found");
    process.exit(0);
  }
  const tripCopy = { ...trip };
  delete tripCopy.images;
  console.log('Trip FR07777 without images:\n', JSON.stringify(tripCopy, null, 2));
  console.log('\nrawValues with index:');
  (trip.rawValues || []).forEach((v: any, i: number) => {
    console.log(`[${i}]: ${JSON.stringify(v)}`);
  });
  process.exit(0);
}

inspectFR07777().catch((err: any) => {
  console.error(err);
  process.exit(1);
});

export {};
