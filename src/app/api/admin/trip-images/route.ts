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

export async function POST(request: Request) {
  try {
    const { ref, name, dataUrl } = await request.json();

    if (!ref || !dataUrl) {
      return NextResponse.json({ error: "Reference and image data are required" }, { status: 400 });
    }

    await dbConnect();
    const trip = await Trip.findOne({ reference: ref });

    if (!trip) {
      return NextResponse.json({ error: "Trip record not found" }, { status: 404 });
    }

    const imageName = name ? String(name).trim() : `IMAGE_${Date.now()}`;
    const newImg = { name: imageName, dataUrl };

    if (!trip.images) {
      trip.images = [];
    }

    trip.images.push(newImg);
    await trip.save();

    return NextResponse.json({ success: true, images: trip.images });
  } catch (error: any) {
    console.error("Error adding trip image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { ref, index, name } = await request.json();

    if (!ref) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    await dbConnect();
    const trip = await Trip.findOne({ reference: ref });

    if (!trip) {
      return NextResponse.json({ error: "Trip record not found" }, { status: 404 });
    }

    if (!trip.images || trip.images.length === 0) {
      return NextResponse.json({ success: true, images: [] });
    }

    if (typeof index === "number" && index >= 0 && index < trip.images.length) {
      trip.images.splice(index, 1);
    } else if (name) {
      trip.images = trip.images.filter((img: any) => img.name !== name);
    }

    await trip.save();

    return NextResponse.json({ success: true, images: trip.images });
  } catch (error: any) {
    console.error("Error deleting trip image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
