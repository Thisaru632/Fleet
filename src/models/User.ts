import mongoose, { Schema } from "mongoose";

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String },
  driverId: { type: String },
  name: { type: String },
  phone: { type: String },
  status: { type: String, default: "Active" },
  // Store the raw array just in case
  rawValues: { type: [Schema.Types.Mixed] },
}, { timestamps: true });

if (mongoose.models.User) {
  delete mongoose.models.User;
}
if (mongoose.connection && mongoose.connection.models && mongoose.connection.models.User) {
  delete mongoose.connection.models.User;
}
export default mongoose.model("User", UserSchema);
