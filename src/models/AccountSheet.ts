import mongoose, { Schema } from "mongoose";

const AccountSheetSchema: Schema = new Schema({
  sheetRowIndex: { type: Number }, // To keep track of row if needed
  date: { type: Date, required: true },
  bookingRef: { type: String },
  driverId: { type: String },
  vehicle: { type: String },
  status: { type: String },
  rawValues: { type: [Schema.Types.Mixed] },
}, { timestamps: true });

// Create a unique index on bookingRef to avoid duplicates if applicable
// But since the user wants a separate table, I'll just use the raw values
// and maybe a combination of date/ref as identifier.

export default mongoose.models.AccountSheet || mongoose.model("AccountSheet", AccountSheetSchema);
