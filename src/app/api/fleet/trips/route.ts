import { NextResponse } from "next/server";
import { getSheets } from "@/lib/google";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import AccountSheet from "@/models/AccountSheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get("drvId");

  if (!drvId) {
    return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
  }

  try {
    await dbConnect();
    let filteredTripRefs: any[] = [];
    let accountDocs: any[] = [];
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      accountDocs = await AccountSheet.find({ 
        status: { $regex: /^Assigned$/i },
        date: { $gte: startOfDay, $lte: endOfDay }
      });
      const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, '')) || '';
      const tripRefs = accountDocs
        .map(doc => {
          const ref = doc.bookingRef || doc.rawValues?.[11];
          const vehicle = doc.vehicle || doc.rawValues?.[7];
          return {
            ref: ref ? ref.toString().trim() : "",
            vehicle: vehicle ? vehicle.toString().trim() : "",
            startMeter: parseNum(doc.rawValues?.[54]),
            endMeter: parseNum(doc.rawValues?.[57])
          };
        })
        .filter(item => item.ref && item.ref !== "N/A" && item.ref !== "");

      const allTripsInDb = await Trip.find({}, { reference: 1 });
      const usedTripRefs = new Set(allTripsInDb.map((t: any) => t.reference.trim()));
      filteredTripRefs = tripRefs.filter((item: any) => !usedTripRefs.has(item.ref.toString().trim()));
    } catch (accountError) {
      console.error("AccountSheet fetch failed, skipping tripRefs:", accountError);
      // Continue without tripRefs if fetch fails
    }

    const tripsInDb = await Trip.find(
      { driverId: { $regex: new RegExp(`^${drvId}$`, "i") } },
      null,
      { sort: { updatedAt: -1 }, allowDiskUse: true }
    );

    // Pending trips (FR refs) for this driver from MongoDB
    const frRefs = tripsInDb
      .filter((t: any) => {
        const garageEnd = t.rawValues ? t.rawValues[8] : "";
        return garageEnd === undefined || garageEnd === null || garageEnd === "";
      })
      .map((t: any) => t.reference);

    const historyFrRefs = tripsInDb
      .filter((t: any) => t.rawValues && t.rawValues[7] && t.rawValues[7] !== "")
      .slice(0, 10)
      .map((t: any) => t.reference);

    return NextResponse.json({ tripRefs: filteredTripRefs, frRefs, historyFrRefs });
  } catch (error: any) {
    console.error("Error fetching trips/refs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
