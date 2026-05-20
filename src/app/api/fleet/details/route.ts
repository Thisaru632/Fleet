import { NextResponse } from "next/server";
import { getSheets } from "@/lib/google";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import AccountSheet from "@/models/AccountSheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "trip" or "fr"
  const ref = searchParams.get("ref");

  if (!ref || !type) {
    return NextResponse.json({ error: "Ref and Type are required" }, { status: 400 });
  }

  try {
    await dbConnect();
    
    if (type === "trip") {
      const accountDoc = await AccountSheet.findOne({
        $or: [
          { bookingRef: ref.trim() },
          { rawValues: ref.trim() }
        ]
      });
      const details = accountDoc ? accountDoc.rawValues : null;
      return NextResponse.json({ details });
    } else {
      // MOVED to MongoDB for "fr" (Fleet data)
      const trip = await Trip.findOne({ reference: ref.trim() });
      
      if (!trip) {
        return NextResponse.json({ error: "Reference not found" }, { status: 404 });
      }

      const details = trip.rawValues || [];
      if (details.length === 0) {
        const row = new Array(25).fill("");
        row[0] = trip.status;
        row[1] = trip.reference;
        row[2] = trip.timestamp;
        row[3] = trip.driverId;
        row[4] = trip.vehicle;
        row[5] = trip.purpose;
        row[9] = trip.fuel;
        row[11] = trip.repair;
        row[13] = trip.scDue;
        row[14] = trip.commission;
        row[21] = trip.mileage;
        row[23] = trip.finalPrice;
        return NextResponse.json({ details: row });
      }

      return NextResponse.json({ details });
    }
  } catch (error: any) {
    console.error("Error fetching details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
