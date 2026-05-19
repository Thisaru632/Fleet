const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<db_password>")) {
    console.error("❌ ERROR: MONGODB_URI is missing or still contains <db_password> in .env.local");
    process.exit(1);
  }

  console.log("Testing connection...");

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ SUCCESS: Connected to MongoDB successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ FAILED: Could not connect to MongoDB.");
    console.error("Error Message:", err.message);
    if (err.message.includes("IP that isn't whitelisted")) {
      console.log("\n👉 FIX: Go to Atlas -> Network Access and click 'Add Current IP Address'");
    }
    process.exit(1);
  }
}

testConnection();
