import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password, name, phone, role, status } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set: { password, name, phone, role, status } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Error editing driver:", error);
    return NextResponse.json({ error: error.message || "Failed to edit driver." }, { status: 500 });
  }
}
