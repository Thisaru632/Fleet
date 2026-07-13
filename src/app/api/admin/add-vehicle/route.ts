import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { vehicleNumber } = await request.json();

    if (!vehicleNumber) {
      return NextResponse.json({ error: "Vehicle number is required" }, { status: 400 });
    }

    await dbConnect();

    // Fetch the added_vehicles array from SheetMetadata
    let metadata = await SheetMetadata.findOne({ key: "added_vehicles" });
    
    if (!metadata) {
      metadata = new SheetMetadata({
        key: "added_vehicles",
        value: [vehicleNumber]
      });
    } else {
      if (!Array.isArray(metadata.value)) {
        metadata.value = [];
      }
      
      // Add if not already exists
      if (!metadata.value.includes(vehicleNumber)) {
        metadata.value.push(vehicleNumber);
        // Mongoose needs to know the mixed type array was modified
        metadata.markModified('value');
      }
    }

    await metadata.save();

    return NextResponse.json({ success: true, vehicleNumber });
  } catch (error: any) {
    console.error("Add vehicle error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
