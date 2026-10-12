const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema({
  status: { type: String, default: "Pending" },
  reference: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  driverId: { type: String, required: true },
  vehicle: { type: String },
  purpose: { type: String },
  fuel: { type: Number, default: 0 },
  repair: { type: Number, default: 0 },
  scDue: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  mileage: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  folderUrl: { type: String },
  folderId: { type: String },
  images: { type: [{ name: String, dataUrl: String }], default: [] },
  rawValues: { type: [mongoose.Schema.Types.Mixed] }, 
}, { timestamps: true });

const Trip = mongoose.models.Trip || mongoose.model("Trip", TripSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB for update...\n");

  // Trip 1: Booking Ref 20260982425 (FR08050)
  const trip1 = await Trip.findOne({ "rawValues.12": "20260982425" });
  if (trip1) {
    console.log(`Found Trip 1 (${trip1.reference}):`);
    console.log(`  Current rawValues[7]: ${trip1.rawValues[7]}`);
    const newRawValues1 = [...trip1.rawValues];
    newRawValues1[7] = "2026-09-30 23:59:52";
    
    await Trip.updateOne(
      { _id: trip1._id },
      { $set: { rawValues: newRawValues1 } }
    );
    console.log(`  New rawValues[7]: 2026-09-30 23:59:52 (Updated successfully)\n`);
  } else {
    console.log("Trip 1 (20260982425) NOT found!\n");
  }

  // Trip 2: Booking Ref 20260982419 (FR08055)
  const trip2 = await Trip.findOne({ "rawValues.12": "20260982419" });
  if (trip2) {
    console.log(`Found Trip 2 (${trip2.reference}):`);
    console.log(`  Current rawValues[7]: ${trip2.rawValues[7]}`);
    const newRawValues2 = [...trip2.rawValues];
    newRawValues2[7] = "2026-09-30 23:59:49";
    
    await Trip.updateOne(
      { _id: trip2._id },
      { $set: { rawValues: newRawValues2 } }
    );
    console.log(`  New rawValues[7]: 2026-09-30 23:59:49 (Updated successfully)\n`);
  } else {
    console.log("Trip 2 (20260982419) NOT found!\n");
  }

  // Verification step
  console.log("=== VERIFYING UPDATED RECORDS ===");
  const updatedTrips = await Trip.find({ "rawValues.12": { $in: ["20260982425", "20260982419"] } }).lean();
  for (const t of updatedTrips) {
    console.log(`Ref: ${t.reference} | Booking Ref: ${t.rawValues[12]} | End Date (rawValues[7]): ${t.rawValues[7]}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error updating trips:", err);
  process.exit(1);
});
