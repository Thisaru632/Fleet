import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Trip from "@/models/Trip";
import AccountSheet from "@/models/AccountSheet";
import Message from "@/models/Message";
import DriverAdjustment from "@/models/DriverAdjustment";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, originalUsername, password, name, phone, role, status } = body;

    const currentUsername = originalUsername || username;
    const newUsername = typeof username === "string" ? username.trim() : username;

    if (!currentUsername || !newUsername) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    const renamed = newUsername !== currentUsername;

    if (renamed) {
      const existing = await User.findOne({ username: newUsername }).lean();
      if (existing) {
        return NextResponse.json({ error: "Username already exists." }, { status: 409 });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: currentUsername },
      { $set: { username: newUsername, password, name, phone, role, status } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    // Cascade the new driver code everywhere the old one is stored.
    if (renamed) {
      const exact = new RegExp(`^\\s*${escapeRegex(currentUsername)}\\s*$`, "i");
      const replaceInRaw = { $set: { "rawValues.$[e]": newUsername } };
      const rawFilter = { arrayFilters: [{ e: { $regex: exact } }] };

      await Promise.all([
        // User profile (rawValues[0] is the login code returned to the frontend)
        User.updateOne(
          { _id: updatedUser._id, "rawValues.0": { $regex: exact } },
          { $set: { "rawValues.0": newUsername } }
        ),
        Trip.updateMany({ driverId: exact }, { $set: { driverId: newUsername } }),
        Trip.updateMany({ rawValues: { $regex: exact } }, replaceInRaw, rawFilter),
        AccountSheet.updateMany({ driverId: exact }, { $set: { driverId: newUsername } }),
        AccountSheet.updateMany({ rawValues: { $regex: exact } }, replaceInRaw, rawFilter),
        Message.updateMany({ driverId: exact }, { $set: { driverId: newUsername } }),
        DriverAdjustment.updateMany({ driverCode: exact }, { $set: { driverCode: newUsername } }),
      ]);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Error editing driver:", error);
    return NextResponse.json({ error: error.message || "Failed to edit driver." }, { status: 500 });
  }
}
