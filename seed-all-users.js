const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

const usersData = [
  { username: "SCD001", password: "1001", name: "Udara Sampath", phone: "778766177", role: "Admin", status: "Active" },
  { username: "SCD002", password: "1002", name: "Sumudu Kaluarachchi", phone: "", role: "Driver", status: "" },
  { username: "SCD003", password: "1003", name: "Gayan Pradeep", phone: "765669873", role: "Driver", status: "Active" },
  { username: "SCD004", password: "1004", name: "Chamath Kariyawasam", phone: "", role: "Driver", status: "Active" },
  { username: "SCD005", password: "1005", name: "Gayana Prasanna Amarasinghe", phone: "", role: "Driver", status: "Active" },
  { username: "SCD006", password: "1006", name: "Randina Prasad", phone: "", role: "Driver", status: "" },
  { username: "SCD007", password: "1007", name: "Namal Mahesh", phone: "97470652245", role: "Driver", status: "" },
  { username: "SCD008", password: "1008", name: "Shalani Kau", phone: "", role: "Driver", status: "" },
  { username: "SCD009", password: "1009", name: "Dilshan", phone: "", role: "Driver", status: "" },
  { username: "SCD010", password: "1010", name: "Nimesh", phone: "", role: "Driver", status: "" },
  { username: "SCD011", password: "1011", name: "Malinda Mihiranga", phone: "", role: "Driver", status: "" },
  { username: "SCD012", password: "1012", name: "Roshan", phone: "", role: "Driver", status: "Active" },
  { username: "SCD013", password: "1013", name: "Sahan Udara", phone: "", role: "Driver", status: "" },
  { username: "SCD014", password: "1014", name: "Mahesh Kumara", phone: "", role: "Driver", status: "" },
  { username: "SCD015", password: "1015", name: "Bandara", phone: "", role: "Driver", status: "" },
  { username: "SCD016", password: "1016", name: "Dilan", phone: "", role: "Driver", status: "" },
  { username: "SCD017", password: "1017", name: "Lakshan", phone: "", role: "Driver", status: "Active" },
  { username: "SCD018", password: "1018", name: "Ransala", phone: "", role: "Driver", status: "Active" },
  { username: "SCD019", password: "1019", name: "Hemantha", phone: "", role: "Driver", status: "Active" },
  { username: "SCD020", password: "1020", name: "Samith Ranaweera", phone: "", role: "Driver", status: "" },
  { username: "SCD021", password: "1021", name: "Hasitha", phone: "", role: "Driver", status: "Active" },
  { username: "SCD022", password: "1022", name: "Chamila Ruwan", phone: "", role: "Driver", status: "" },
  { username: "SCD023", password: "1023", name: "Sujeewa Sampath", phone: "", role: "Driver", status: "Active" },
  { username: "SCD024", password: "1024", name: "Jayantha", phone: "", role: "Driver", status: "Active" },
  { username: "SCD025", password: "1025", name: "Hansana", phone: "", role: "Driver", status: "Active" }
];

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
    status: { type: String },
    rawValues: [mongoose.Schema.Types.Mixed]
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  for (const user of usersData) {
    const userData = {
      username: user.username,
      password: user.password,
      name: user.name,
      phone: user.phone,
      role: user.role,
      driverId: user.username,
      status: user.status
    };

    await User.findOneAndUpdate(
      { username: userData.username },
      userData,
      { upsert: true, new: true }
    );
    console.log(`Seeded ${userData.username}`);
  }

  console.log("All users seeded successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
