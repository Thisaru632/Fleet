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
    const purposes = await Trip.distinct("purpose", { purpose: { $nin: [null, ""] } });

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
