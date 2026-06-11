const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const TripSchema = new mongoose.Schema({
    driverId: String
  }, { strict: false });
  const Trip = mongoose.models.Trip || mongoose.model("Trip", TripSchema);
  const emptyDrivers = await Trip.countDocuments({ $or: [{driverId: null}, {driverId: ""}, {driverId: {$exists: false}}] });
  console.log("Trips with empty driverId:", emptyDrivers);
  process.exit(0);
}
check().catch(console.error);
