const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

async function searchAllCollections() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log('Collections in database:', collections.map(c => c.name));

  for (const col of collections) {
    const name = col.name;
    const docs = await db.collection(name).find({
      $or: [
        { reference: 'FR08023' },
        { bookingRef: 'FR08023' },
        { rawValues: 'FR08023' }
      ]
    }).toArray();

    if (docs.length > 0) {
      console.log(`Found in collection "${name}": ${docs.length} documents`);
    }

    // Also check if any text/regex match
    const regexDocs = await db.collection(name).find({
      $text: { $search: 'FR08023' }
    }).toArray().catch(() => []);
    if (regexDocs.length > 0) {
      console.log(`Text search found in "${name}": ${regexDocs.length} documents`);
    }
  }

  process.exit(0);
}

searchAllCollections().catch(console.error);
