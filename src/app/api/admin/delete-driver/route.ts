import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    const deletedUser = await User.findOneAndDelete({ username });

    if (!deletedUser) {
      return NextResponse.json({ error: "Driver not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Driver deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting driver:", error);
    return NextResponse.json({ error: error.message || "Failed to delete driver." }, { status: 500 });
  }
}
