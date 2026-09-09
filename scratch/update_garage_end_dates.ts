const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const dbConnect = require("../src/lib/mongodb").default;
const Trip = require("../src/models/Trip").default;

async function main() {
  await dbConnect();
  console.log("Connected to MongoDB for update...\n");

  // Trip 1: Booking Ref 20260880992 (FR07720)
  const trip1 = await Trip.findOne({ "rawValues.12": "20260880992" });
  if (trip1) {
    console.log(`Found Trip 1 (${trip1.reference}):`);
    console.log(`  Old rawValues[7]: ${trip1.rawValues[7]}`);
    const newRawValues1 = [...trip1.rawValues];
    newRawValues1[7] = "2026-08-31 23:59:52";
    
    await Trip.updateOne(
      { _id: trip1._id },
      { $set: { rawValues: newRawValues1 } }
    );
    console.log(`  New rawValues[7]: 2026-08-31 23:59:52 (Updated successfully)\n`);
  } else {
    console.log("Trip 1 (20260880992) NOT found!\n");
  }

  // Trip 2: Booking Ref 20260880985 (FR07723)
  const trip2 = await Trip.findOne({ "rawValues.12": "20260880985" });
  if (trip2) {
    console.log(`Found Trip 2 (${trip2.reference}):`);
    console.log(`  Old rawValues[7]: ${trip2.rawValues[7]}`);
    const newRawValues2 = [...trip2.rawValues];
    newRawValues2[7] = "2026-08-31 23:59:49";
    
    await Trip.updateOne(
      { _id: trip2._id },
      { $set: { rawValues: newRawValues2 } }
    );
    console.log(`  New rawValues[7]: 2026-08-31 23:59:49 (Updated successfully)\n`);
  } else {
    console.log("Trip 2 (20260880985) NOT found!\n");
  }

  // Verification step
  console.log("=== VERIFYING UPDATED RECORDS ===");
  const updatedTrips = await Trip.find({ "rawValues.12": { $in: ["20260880992", "20260880985"] } }).lean();
  for (const t of updatedTrips) {
    console.log(`Ref: ${t.reference} | Booking Ref: ${t.rawValues[12]} | End Date (rawValues[7]): ${t.rawValues[7]}`);
  }

  process.exit(0);
}

main().catch((err: any) => {
  console.error("Error updating trips:", err);
  process.exit(1);
});
