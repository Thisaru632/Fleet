const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const dbConnect = require("../src/lib/mongodb").default;
const Trip = require("../src/models/Trip").default;

async function main() {
  await dbConnect();
  console.log("Connected to MongoDB for updating FR07380 to 07/30...\n");

  const trip = await Trip.findOne({ reference: "FR07380" });
  if (trip) {
    console.log(`Found Trip FR07380:`);
    console.log(`  Old rawValues[7]: ${trip.rawValues[7]}`);
    const newRawValues = [...trip.rawValues];
    newRawValues[7] = "2026-07-30 23:59:33";
    
    await Trip.updateOne(
      { _id: trip._id },
      { $set: { rawValues: newRawValues } }
    );
    console.log(`  New rawValues[7]: 2026-07-30 23:59:33 (Updated successfully)\n`);
  } else {
    console.log("Trip FR07380 NOT found!\n");
  }

  // Verification step
  console.log("=== VERIFYING UPDATED RECORD ===");
  const updatedTrip = await Trip.findOne({ reference: "FR07380" }).lean();
  if (updatedTrip) {
    console.log(`Ref: ${updatedTrip.reference} | Purpose: ${updatedTrip.purpose} | End Date (rawValues[7]): ${updatedTrip.rawValues[7]}`);
  }

  process.exit(0);
}

main().catch((err: any) => {
  console.error("Error updating FR07380:", err);
  process.exit(1);
});
