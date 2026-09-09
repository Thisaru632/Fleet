import mongoose, { Schema } from "mongoose";

const DriverAdjustmentSchema: Schema = new Schema({
  driverCode: { type: String, required: true },
  month: { type: String, required: true },
  salaryAdvance: { type: Number, default: 0 },
  shorts: { type: Number, default: 0 },
  excess: { type: Number, default: 0 },
  inclusions: { type: Number, default: 0 },
  exclusions: { type: Number, default: 0 },
  comment: { type: String, default: "" },
  exclusionsComment: { type: String, default: "" },
}, { timestamps: true });

DriverAdjustmentSchema.index({ driverCode: 1, month: 1 }, { unique: true });

export default mongoose.models.DriverAdjustment || mongoose.model("DriverAdjustment", DriverAdjustmentSchema);
