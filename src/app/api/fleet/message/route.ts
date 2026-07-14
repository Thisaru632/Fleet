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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const drvId = searchParams.get('drvId');
    const type = searchParams.get('type') || 'sent';

    if (!drvId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
    }

    await dbConnect();
    
    const query: any = { driverId: drvId };
    
    if (type === 'inbox') {
      // Admin to Driver (includes old "ghost" admin messages that lack driverName due to mongoose cache strict stripping)
      query.$or = [
        { sender: 'Admin' },
        { sender: { $ne: 'Admin' }, driverName: { $exists: false } },
        { sender: { $ne: 'Admin' }, driverName: null }
      ];
    } else {
      // Driver to Admin
      query.sender = { $ne: 'Admin' };
      query.driverName = { $exists: true, $ne: null };
    }

    const messages = await Message.find(query).sort({ timestamp: -1 }).limit(10).lean();
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Message ID is required" }, { status: 400 });

    await dbConnect();
    await Message.findByIdAndUpdate(id, { isRead: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
