import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ error: "Reference is required" }, { status: 400 });
  }

  try {
    await dbConnect();
    const trip = await Trip.findOne({ reference: ref }, { images: 1 }).lean();
    
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ images: trip.images || [] });
  } catch (error: any) {
    console.error("Error fetching trip images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
