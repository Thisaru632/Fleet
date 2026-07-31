const mongoose = require('mongoose');
const uri = "mongodb+srv://user09senucabs_db_user:O929xNcJ71o7fQ34@cluster0.heu3gps.mongodb.net/fleet";

const SheetMetadataSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const SheetMetadata = mongoose.models.SheetMetadata || mongoose.model("SheetMetadata", SheetMetadataSchema);

async function main() {
  await mongoose.connect(uri);

  // Add WR-0666 and remove DISCOVERY BIKE
  const result = await SheetMetadata.updateOne(
    { key: "added_vehicles" },
    { 
      $addToSet: { value: "WR-0666" },
    }
  );
  console.log('Added WR-0666:', result);

  const pullResult = await SheetMetadata.updateOne(
    { key: "added_vehicles" },
    { 
      $pull: { value: "DISCOVERY BIKE" }
    }
  );
  console.log('Removed DISCOVERY BIKE:', pullResult);

  await mongoose.disconnect();
}

main().catch(console.error);
