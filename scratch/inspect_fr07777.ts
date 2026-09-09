const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConnect = require('../src/lib/mongodb').default;
const Trip = require('../src/models/Trip').default;

async function inspectFR07777() {
  await dbConnect();
  const trip = await Trip.findOne({ reference: 'FR07777' }).lean();
  console.log('Trip FR07777:', JSON.stringify(trip, null, 2));
  process.exit(0);
}

inspectFR07777().catch((err: any) => {
  console.error(err);
  process.exit(1);
});

export {};
