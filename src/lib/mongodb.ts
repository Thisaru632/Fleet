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

// Background Google Sheet sync disabled per user request
async function startBackgroundSync() {
  // Sync stopped
}

async function dbConnect() {
  // If we have a cached connection, check if it's actually connected
  if (cached.conn) {
    const readyState = cached.conn.connection.readyState;
    if (readyState === 1) {
      startBackgroundSync();
      return cached.conn;
    } else {
      console.log(`[MongoDB] Connection state is ${readyState}. Forcing reconnect...`);
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 10000, // close idle connections early to prevent Atlas timeouts
      family: 4, // Force IPv4 to prevent IPv6 resolution timeouts
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
