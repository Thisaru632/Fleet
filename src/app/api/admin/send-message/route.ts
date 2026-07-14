import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { driverIds, message } = await request.json();

    if (!message || !driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
      return NextResponse.json({ error: "Message and at least one Driver ID are required" }, { status: 400 });
    }

    await dbConnect();

    const now = new Date();
    const timestamp = now.toLocaleString("sv-SE").replace("T", " ");

    const messages = driverIds.map(drvId => ({
      timestamp,
      driverId: drvId,
      message,
      sender: 'Admin'
    }));

    await Message.insertMany(messages);

    return NextResponse.json({ success: true, count: messages.length });
  } catch (error: any) {
    console.error("Admin send message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
