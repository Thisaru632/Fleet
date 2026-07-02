import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await dbConnect();
    const config = await SheetMetadata.findOne({ key: "vehicle_commissions" });
    
    // If it doesn't exist, return empty object
    if (!config || !config.value) {
      return NextResponse.json({ commissions: {} });
    }

    return NextResponse.json({ commissions: config.value });
  } catch (error: any) {
    console.error("Error fetching vehicle commissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { commissions } = await request.json();
    
    if (!commissions || typeof commissions !== "object") {
      return NextResponse.json({ error: "Invalid commissions data" }, { status: 400 });
    }

    await dbConnect();

    // Upsert the document
    await SheetMetadata.findOneAndUpdate(
      { key: "vehicle_commissions" },
      { value: commissions },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, commissions });
  } catch (error: any) {
    console.error("Error saving vehicle commissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
