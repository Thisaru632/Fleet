const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String },
    driverId: { type: String },
    name: { type: String },
    phone: { type: String },
    rawValues: [mongoose.Schema.Types.Mixed]
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const adminData = {
    username: "SCD001",
    password: "1001",
    name: "Udara Sampath",
    phone: "778766177",
    role: "Admin",
    driverId: "SCD001",
    rawValues: ["SCD001", "1001", "Admin", "SCD001", "Udara Sampath"]
  };

  await User.findOneAndUpdate(
    { username: adminData.username },
    adminData,
    { upsert: true, new: true }
  );

  console.log("Admin user SCD001 seeded successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
