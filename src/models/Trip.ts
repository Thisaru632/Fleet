import mongoose, { Schema } from "mongoose";

const TripSchema: Schema = new Schema({
  status: { type: String, default: "Pending" },
  reference: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  driverId: { type: String, required: true },
  vehicle: { type: String },
  purpose: { type: String },
  fuel: { type: Number, default: 0 },
  repair: { type: Number, default: 0 },
  scDue: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  mileage: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  folderUrl: { type: String },
  folderId: { type: String },
  images: { type: [{ name: String, dataUrl: String }], default: [] },
  rawValues: { type: [Schema.Types.Mixed] }, 
}, { timestamps: true });

if (mongoose.models.Trip) {
  delete (mongoose.models as any).Trip;
}

const TripModel = mongoose.model("Trip", TripSchema);
export default TripModel as any;
