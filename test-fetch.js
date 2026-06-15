const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://user09senucabs_db_user:O929xNcJ71o7fQ34@cluster0.heu3gps.mongodb.net/fleet";

async function run() {
  const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 10000,
      family: 4,
  };
  await mongoose.connect(MONGODB_URI, opts);
  const db = mongoose.connection.db;
  console.log("Fetching trips...");
  const start = Date.now();
  const trips = await db.collection('trips').find({}, { projection: { images: 0, rawValues: 0 } }).sort({ timestamp: -1 }).toArray();
  console.log(`Fetched ${trips.length} trips in ${Date.now() - start}ms`);
  process.exit(0);
}
run();
