import mongoose, { Schema } from "mongoose";

const BankReceiptSchema: Schema = new Schema({
  reference: { type: String, required: true },
  tripRef: { type: String, default: "" },
  driverId: { type: String, required: true },
  vehicle: { type: String, default: "" },
  finalPrice: { type: Number, default: 0 },
  receiptValue: { type: Number, required: true },
  comments: { type: String, default: "" },
  imageName: { type: String, default: "" },
  imageDataUrl: { type: String, default: "" },
  status: { type: String, default: "Submitted" },
}, { timestamps: true });

BankReceiptSchema.index({ createdAt: -1 });
BankReceiptSchema.index({ reference: 1 });

export default mongoose.models.BankReceipt || mongoose.model("BankReceipt", BankReceiptSchema);
