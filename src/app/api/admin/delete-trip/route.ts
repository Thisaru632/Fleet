import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    await dbConnect();
    const result = await Trip.deleteOne({ reference: ref.trim() });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Trip successfully deleted" });
  } catch (error: any) {
    console.error("Delete trip error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
