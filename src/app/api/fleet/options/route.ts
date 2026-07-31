import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch unique vehicles and purposes from all existing trips in MongoDB
    const dbVehicles = await Trip.distinct("vehicle", { vehicle: { $nin: [null, ""] } });
    const addedVehiclesMeta = await SheetMetadata.findOne({ key: "added_vehicles" }).lean();
    const dbPurposes = await Trip.distinct("purpose", { purpose: { $nin: [null, ""] } });

    // Ensure default vehicles and purposes are always available
    const defaultVehicles = ["PK-3991"];
    const vehicles = Array.from(new Set([...defaultVehicles, ...dbVehicles, ...(addedVehiclesMeta?.value || [])]));

    const defaultPurposes = ["Hire", "Repair", "Personal", "Fuel", "Office Use"];
    const purposes = Array.from(new Set([...defaultPurposes, ...dbPurposes]));

    // Sort alphabetically
    vehicles.sort();
    purposes.sort();

    return NextResponse.json({ 
      vehicles: vehicles, 
      purposes: purposes
    });
  } catch (error: any) {
    console.error("Error fetching options:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
