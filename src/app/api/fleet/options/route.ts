import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch unique vehicles and purposes from all existing trips in MongoDB
    const vehicles = await Trip.distinct("vehicle", { vehicle: { $nin: [null, ""] } });
    const dbPurposes = await Trip.distinct("purpose", { purpose: { $nin: [null, ""] } });

    // Ensure default purposes are always available
    const defaultPurposes = ["Hire", "Repair", "Personal", "Fuel"];
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
