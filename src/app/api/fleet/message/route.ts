import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { drvId, drvName, drvPhone, message } = await request.json();

    if (!message || !drvId) {
      return NextResponse.json({ error: "Message and Driver ID are required" }, { status: 400 });
    }

    await dbConnect();

    const now = new Date();
    const timestamp = now.toLocaleString("sv-SE").replace("T", " ");

    const newMessage = new Message({
      timestamp,
      driverId: drvId,
      driverName: drvName,
      phoneNumber: drvPhone,
      message,
    });

    await newMessage.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Message submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
