const fs = require('fs');
const dotenv = require('dotenv');
const envLocal = dotenv.parse(fs.readFileSync('.env.local'));
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(envLocal.MONGODB_URI);
  const Trip = mongoose.models.Trip || mongoose.model("Trip", new mongoose.Schema({
    status: String,
    reference: String,
    rawValues: Array
  }, { strict: false }));

  const trip = await Trip.findOne({ reference: "FR08316" });
  if (!trip) {
    console.error("Trip FR08316 not found!");
    process.exit(1);
  }

  console.log("=== BEFORE UPDATE ===");
  console.log("Reference:", trip.reference);
  console.log("Current End TS (rawValues[7]):", trip.rawValues[7]);

  // Update rawValues[7]
  const newRawValues = [...trip.rawValues];
  newRawValues[7] = "2026-11-01 19:23:16";

  const res = await Trip.updateOne(
    { reference: "FR08316" },
    { $set: { "rawValues.7": "2026-11-01 19:23:16" } }
  );

  console.log("Update result:", res);

  // Verify
  const updated = await Trip.findOne({ reference: "FR08316" }).lean();
  console.log("=== AFTER UPDATE ===");
  console.log("Reference:", updated.reference);
  console.log("New End TS (rawValues[7]):", updated.rawValues[7]);

  process.exit(0);
}

main().catch(err => {
  console.error("Error updating FR08316:", err);
  process.exit(1);
});

