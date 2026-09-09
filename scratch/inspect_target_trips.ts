const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const dbConnect = require("../src/lib/mongodb").default;
const Trip = require("../src/models/Trip").default;

async function main() {
  await dbConnect();
  const refs = ["20260880992", "20260880985"];
  
  console.log("=== CHECKING MONGODB BY REFERENCE & RAW VALUES ===");
  const trips = await Trip.find({
    $or: [
      { reference: { $in: refs } },
      { "rawValues.12": { $in: refs } }
    ]
  }).lean();

  if (trips.length === 0) {
    console.log("No trips found directly matching reference in reference field. Searching all trips...");
    const allTrips = await Trip.find({}).lean();
    const matches = allTrips.filter((t: any) => {
      const str = JSON.stringify(t);
      return refs.some(r => str.includes(r));
    });
    console.log(`Found ${matches.length} matching trips in full search:`);
    for (const m of matches) {
      console.log("----------------------------------------");
      console.log("DB ID:", m._id);
      console.log("FR Reference:", m.reference);
      console.log("Booking Ref (rawValues[12]):", m.rawValues?.[12]);
      console.log("Status:", m.status);
      console.log("Timestamp:", m.timestamp, "| rawValues[2]:", m.rawValues?.[2]);
      console.log("Garage End Date (rawValues[7]):", m.rawValues?.[7]);
      console.log("Full rawValues:", JSON.stringify(m.rawValues, null, 2));
    }
  } else {
    for (const t of trips) {
      console.log("----------------------------------------");
      console.log("DB ID:", t._id);
      console.log("FR Reference:", t.reference);
      console.log("Booking Ref (rawValues[12]):", t.rawValues?.[12]);
      console.log("Status:", t.status);
      console.log("Timestamp:", t.timestamp, "| rawValues[2]:", t.rawValues?.[2]);
      console.log("Garage End Date (rawValues[7]):", t.rawValues?.[7]);
      console.log("Full rawValues:", JSON.stringify(t.rawValues, null, 2));
    }
  }

  process.exit(0);
}

main().catch((err: any) => {
  console.error(err);
  process.exit(1);
});
