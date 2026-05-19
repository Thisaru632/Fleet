import mongoose, { Schema } from "mongoose";

const MessageSchema: Schema = new Schema({
  timestamp: { type: String, required: true },
  driverId: { type: String, required: true },
  driverName: { type: String },
  phoneNumber: { type: String },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
