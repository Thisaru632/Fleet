const mongoose = require('mongoose');
const uri = "mongodb+srv://user09senucabs_db_user:O929xNcJ71o7fQ34@cluster0.heu3gps.mongodb.net/fleet";

const SheetMetadataSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const SheetMetadata = mongoose.models.SheetMetadata || mongoose.model("SheetMetadata", SheetMetadataSchema);

async function main() {
  await mongoose.connect(uri);
  const result = await SheetMetadata.updateOne(
    { key: "added_vehicles" },
    { $addToSet: { value: "DISCOVERY BIKE" } },
    { upsert: true }
  );
  console.log('Update result:', result);
  await mongoose.disconnect();
}

main().catch(console.error);
