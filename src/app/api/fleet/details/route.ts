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
      if (!accountDoc) {
        return NextResponse.json({ details: null });
      }

      const raw = accountDoc.rawValues || [];
      if (Array.isArray(raw) && (raw.length === 15 || raw.length === 17)) {
        // Expand format to legacy indices expected by the driver app:
        // raw indices:
        // [0]: Booking Ref, [1]: Start Date, [2]: end date, [3]: end date, [4]: End Time,
        // [5]: Vehicle Type, [6]: No of pax, [7]: Pick up Street, [8]: Drop off Str, [9]: Journey Type,
        // [10]: Start Meter, [11]: End Meter, [12]: No. of KMs, [13]: Distance, [14]: Final Price,
        // [15]: Trip Status, [16]: Driver Code
        const expanded = new Array(60).fill("");
        for (let i = 0; i < raw.length; i++) {
          expanded[i] = raw[i];
        }
        expanded[0] = raw[15] || raw[0]; // Trip Status
        expanded[4] = raw[14];  // Final Price
        expanded[9] = raw[16] || ""; // Driver Code
        expanded[11] = raw[0];  // Booking Ref
        expanded[13] = raw[1];  // Start Date
        expanded[14] = raw[2];  // end date / Start Time
        expanded[15] = raw[3];  // end date
        expanded[16] = raw[4];  // End Time
        expanded[17] = raw[5];  // Vehicle Type
        expanded[18] = raw[6];  // No of pax
        expanded[24] = raw[7];  // Pick up Street
        expanded[25] = raw[8];  // Drop off Str / Pick up City
        expanded[30] = raw[9];  // Journey Type
        expanded[33] = raw[12]; // No. of KMs (Pkg allowance)
        expanded[54] = raw[10]; // Start Meter
        expanded[57] = raw[11]; // End Meter
        expanded[58] = raw[13]; // Distance (Run Distance)
        return NextResponse.json({ details: expanded });
      }

      return NextResponse.json({ details: raw });
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
