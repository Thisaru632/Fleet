const mongoose = require("mongoose");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID_DRIVER || "1AWPhVc4cMHuUwj6Q3FEvUfj7bUYhwnThOfH8VT7ny8w";

async function migrate() {
  console.log("Starting migration...");
  
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env.local");
    process.exit(1);
  }

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Define Schema locally for the script
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String },
    driverId: { type: String },
    name: { type: String },
    rawValues: [mongoose.Schema.Types.Mixed]
  });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  // Auth with Google
  const jsonPath = path.join(__dirname, "src/lib/service-account.json");
  const auth = new google.auth.GoogleAuth({
    keyFile: jsonPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Get data from Sheet2
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet2!A:E",
  });

  const rows = response.data.values || [];
  console.log(`Found ${rows.length} users in sheet`);

  for (const row of rows) {
    if (!row[0] || !row[1]) continue; // Skip empty rows

    const existingUser = await User.findOne({ username: row[0] });
    if (!existingUser) {
      await User.create({
        username: row[0],
        password: row[1],
        role: row[2] || "user",
        driverId: row[3] || "",
        name: row[4] || "",
        rawValues: row
      });
      console.log(`Migrated user: ${row[0]}`);
    } else {
      console.log(`User already exists: ${row[0]}`);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
