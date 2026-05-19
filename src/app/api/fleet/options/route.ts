import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch unique vehicles and purposes from all existing trips in MongoDB
    const vehicles = await Trip.distinct("vehicle", { vehicle: { $ne: null, $ne: "" } });
    const purposes = await Trip.distinct("purpose", { purpose: { $ne: null, $ne: "" } });

    // Sort alphabetically
    vehicles.sort();
    purposes.sort();

    return NextResponse.json({ 
      vehicles: vehicles.length > 0 ? vehicles : ["V001", "V002"], 
      purposes: purposes.length > 0 ? purposes : ["Hire", "Repair", "Personal", "Fuel"] 
    });
  } catch (error: any) {
    console.error("Error fetching options:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
