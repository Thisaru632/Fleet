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
      // Calculate current date in Asia/Colombo timezone (UTC+5:30)
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);

      const year = Number(parts.find(p => p.type === "year")?.value);
      const month = Number(parts.find(p => p.type === "month")?.value) - 1;
      const day = Number(parts.find(p => p.type === "day")?.value);

      // Bounds in local timezone (UTC+5:30) and UTC midnight to ensure dates match regardless of server time
      const startOfLocalDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
      const endOfLocalDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
      const startOfUtcDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endOfUtcDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

      const queryStart = new Date(Math.min(startOfLocalDay.getTime(), startOfUtcDay.getTime()));
      const queryEnd = new Date(Math.max(endOfLocalDay.getTime(), endOfUtcDay.getTime()));

      accountDocs = await AccountSheet.find({ 
        status: { $regex: /^Assigned$/i },
        date: { $gte: queryStart, $lte: queryEnd }
      });
      const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, '')) || '';
      const tripRefs = accountDocs
        .filter(doc => {
          const status = (doc.status || '').toLowerCase();
          if (status.includes('cnx') || status.includes('complete')) return false;
          const startMeterRaw = doc.rawValues?.[54];
          if (startMeterRaw !== undefined && startMeterRaw !== null && String(startMeterRaw).trim() !== '') return false;
          return true;
        })
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
      { images: 0 },
      { sort: { updatedAt: -1 }, allowDiskUse: true }
    ).lean() as any[];

    // Pending trips (FR refs) for this driver from MongoDB
    const frRefs = tripsInDb
      .filter((t: any) => {
        const status = (t.status || '').toLowerCase();
        if (status === 'cancelled' || status === 'approved') return false;
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
