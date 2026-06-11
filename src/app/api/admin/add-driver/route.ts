import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password, name, phone, role, status } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    // Check if driver already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists." }, { status: 400 });
    }

    const newUser = new User({
      username,
      password,
      name: name || '',
      phone: phone || '',
      role: role || 'driver',
      status: status || 'Active'
    });

    await newUser.save();

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Error adding driver:", error);
    return NextResponse.json({ error: error.message || "Failed to add driver." }, { status: 500 });
  }
}
