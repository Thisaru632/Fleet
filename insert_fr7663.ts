import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const tripSchema = new mongoose.Schema({
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
  folderUrl: { type: String, default: "" },
  folderId: { type: String, default: "" },
  images: { type: [{ name: String, dataUrl: String }], default: [] },
  rawValues: { type: [mongoose.Schema.Types.Mixed] },
}, { timestamps: true });

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

async function run() {
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB');

  // Check if FR07663 already exists
  const existing = await Trip.findOne({ reference: 'FR07663' });
  if (existing) {
    console.log('FR07663 already exists in DB!');
  } else {
    const rawValues = [
      "Pending",             // 0: status
      "FR07663",             // 1: reference
      "2026-08-27 06:47:20", // 2: timestamp
      "SCD027",              // 3: driverId
      "PK-3991",             // 4: vehicle
      "Hire",                // 5: purpose
      "107849",              // 6: garageStart
      "",                    // 7: end timestamp
      "",                    // 8: garageEnd
      "",                    // 9: fuel cost
      "",                    // 10: staff comment
      "",                    // 11: repair cost
      "",                    // 12: trip ref
      0,                     // 13: scDue
      "",                    // 14: commission
      "",                    // 15: start meter
      "",                    // 16: end meter
      "",                    // 17: loss start
      "",                    // 18: loss end
      "",                    // 19
      "",                    // 20
      "",                    // 21
      0,                     // 22: total mileage
      "",                    // 23: final price
      "",                    // 24
      "",                    // 25
      "",                    // 26
      "",                    // 27
      "",                    // 28
      "https://maps.google.com/?q=6.9048794,79.9448521", // 29: start location map
      "",                    // 30
      "",                    // 31
      ""                     // 32
    ];

    const newTrip = new Trip({
      status: "Pending",
      reference: "FR07663",
      timestamp: "2026-08-27 06:47:20",
      driverId: "SCD027",
      vehicle: "PK-3991",
      purpose: "Hire",
      fuel: 0,
      repair: 0,
      scDue: 0,
      commission: 0,
      mileage: 0,
      finalPrice: 0,
      folderUrl: "",
      folderId: "",
      images: [],
      rawValues: rawValues
    });

    await newTrip.save();
    console.log('Successfully inserted FR07663 into MongoDB!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
