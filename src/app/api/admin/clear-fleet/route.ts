import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    await dbConnect();
    
    // Delete all records from the Trip collection
    const result = await Trip.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} fleet records.`,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error("Error clearing fleet data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
