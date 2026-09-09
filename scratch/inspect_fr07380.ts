const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const dbConnect = require("../src/lib/mongodb").default;
const Trip = require("../src/models/Trip").default;

async function main() {
  await dbConnect();
  console.log("=== INSPECTING FR07380 ===");
  const trip = await Trip.findOne({ reference: "FR07380" }).lean();
  if (!trip) {
    console.log("Trip FR07380 not found directly by reference. Searching all...");
    const all = await Trip.find({}).lean();
    const match = all.find((t: any) => JSON.stringify(t).includes("FR07380"));
    if (match) {
      console.log("Found match:", match.reference, match.rawValues);
    } else {
      console.log("No match found for FR07380");
    }
  } else {
    console.log("Found Trip FR07380:");
    console.log("DB ID:", trip._id);
    console.log("Status:", trip.status);
    console.log("Start Timestamp (rawValues[2]):", trip.timestamp, "| rawValues[2]:", trip.rawValues?.[2]);
    console.log("Garage End Date (rawValues[7]):", trip.rawValues?.[7]);
    console.log("Full rawValues:", JSON.stringify(trip.rawValues, null, 2));
  }
  process.exit(0);
}

main().catch((err: any) => {
  console.error(err);
  process.exit(1);
});
