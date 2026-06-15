const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://user09senucabs_db_user:O929xNcJ71o7fQ34@cluster0.heu3gps.mongodb.net/fleet";

async function run() {
  console.log('Connecting with options...');
  const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 10000,
      family: 4,
  };
  await mongoose.connect(MONGODB_URI, opts);
  console.log('Connected!');
  const db = mongoose.connection.db;
  const count = await db.collection('trips').countDocuments();
  console.log("Total trips:", count);
  process.exit(0);
}
run();
