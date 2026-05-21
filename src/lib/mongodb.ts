import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function startBackgroundSync() {
  if ((global as any).autoSyncStarted) return;
  (global as any).autoSyncStarted = true;
  
  console.log("[AutoSync] Initializing background task (every 5 minutes)...");
  setInterval(async () => {
    try {
      console.log("[AutoSync] Running scheduled account sheet sync...");
      const { runAccountSync } = await import("./syncHelper");
      const result = await runAccountSync();
      console.log("[AutoSync] Scheduled sync completed:", result.message);
    } catch (err) {
      console.error("[AutoSync] Scheduled sync failed:", err);
    }
  }, 5 * 60 * 1000);
}

async function dbConnect() {
  if (cached.conn) {
    startBackgroundSync();
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("New MongoDB connection established successfully");
      return mongoose;
    }).catch((err) => {
      console.error("MongoDB connection promise rejected:", err);
      throw err;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    startBackgroundSync();
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
