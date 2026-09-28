const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

async function checkTripImages() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const count = await db.collection('tripimages').countDocuments({
    $or: [
      { reference: 'FR08023' },
      { name: /FR08023/ }
    ]
  });
  console.log('tripimages matching FR08023:', count);

  process.exit(0);
}

checkTripImages().catch(console.error);
