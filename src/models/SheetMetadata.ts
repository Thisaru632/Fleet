import mongoose, { Schema } from "mongoose";

const SheetMetadataSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.models.SheetMetadata || mongoose.model("SheetMetadata", SheetMetadataSchema);
