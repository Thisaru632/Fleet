import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import AccountSheet from "@/models/AccountSheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = process.env.LAKMOBILE_API_BASE_URL || process.env.BOOKING_API_BASE_URL || 'https://senuportal.lakmobile.com';
const USERNAME = process.env.LAKMOBILE_API_USER || process.env.BOOKING_API_USER || 'vconnect-senu-ext-prod';
const PASSWORD = process.env.LAKMOBILE_API_PASS || process.env.BOOKING_API_PASS || 'YKExtprodKH8988!202897SAM';
const TENANT = process.env.LAKMOBILE_API_TENANT || process.env.BOOKING_API_TENANT || 'vconnect';

function getAuthHeader(): string {
  const credentials = `${USERNAME}:${PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function fetchDriverTripsFromLakMobile(cleanDrvId: string): Promise<any[]> {
  try {
    const now = new Date();
    // Query window: past 14 days to 1 day ahead for active/scheduled/accepted bookings
    const toDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const toStr = toDate.toISOString().split('T')[0];
    const fromDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fromStr = fromDate.toISOString().split('T')[0];

    const url = `${BASE_URL.replace(/\/+$/, '')}/api/ext/bookings?from=${fromStr}&to=${toStr}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'customer-reference': TENANT,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!res.ok) return [];

    const data = await res.json();
    const bookings = Array.isArray(data?.dataBundle) ? data.dataBundle : [];

    const upperDrvId = cleanDrvId.toUpperCase();
    return bookings
      .filter((b: any) => {
        const bDriver = String(b.driverId || '').trim().toUpperCase();
        if (bDriver !== upperDrvId) return false;
        if (bDriver === 'DV1811') return false;

        const status = String(b.status || '').trim().toLowerCase();
        return status === 'accepted' || status === 'scheduled' || status === 'assigned';
      })
      .map((b: any) => ({
        ref: String(b.id).trim(),
        vehicle: String(b.vehiclePlate || b.cabType || '').trim(),
        startMeter: 0,
        endMeter: 0
      }))
      .filter((item: any) => item.ref && item.ref !== 'N/A');
  } catch (err) {
    console.error("Error fetching trips directly from Lak Mobile:", err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get("drvId");

  if (!drvId) {
    return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
  }

  try {
    await dbConnect();
    const cleanDrvId = (drvId || "").trim();

    // 1. Fetch assigned trips directly from Lak Mobile in real-time
    let tripRefs: any[] = await fetchDriverTripsFromLakMobile(cleanDrvId);

    // 2. Fallback / Merge with AccountSheet in MongoDB
    try {
      const drvRegex = new RegExp(`^\\s*${cleanDrvId}\\s*$`, "i");
      const accountDocs = await AccountSheet.find({ 
        $and: [
          {
            $or: [
              { driverId: drvRegex },
              { "rawValues.16": drvRegex },
              { "rawValues.9": drvRegex }
            ]
          },
          {
            $or: [
              { status: { $regex: /^(Accepted|Scheduled|Assigned)$/i } },
              { "rawValues.15": { $regex: /^(Accepted|Scheduled|Assigned)$/i } }
            ]
          }
        ]
      });

      const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, '')) || '';
      const fallbackRefs = accountDocs
        .filter(doc => {
          const is17 = Array.isArray(doc.rawValues) && doc.rawValues.length === 17;
          const status = ((is17 ? doc.rawValues[15] : '') || doc.status || '').toString().trim().toLowerCase();
          if (status !== 'accepted' && status !== 'scheduled' && status !== 'assigned') return false;

          const is15or17 = Array.isArray(doc.rawValues) && (doc.rawValues.length === 15 || doc.rawValues.length === 17);
          const docDriver = (doc.driverId || (is17 ? doc.rawValues[16] : '') || '').toString().trim().toUpperCase();
          if (docDriver && docDriver !== cleanDrvId.toUpperCase()) return false;

          const startMeterRaw = is15or17 ? doc.rawValues?.[10] : doc.rawValues?.[54];
          if (startMeterRaw !== undefined && startMeterRaw !== null && String(startMeterRaw).trim() !== '' && Number(startMeterRaw) > 0) return false;
          return true;
        })
        .map(doc => {
          const is15or17 = Array.isArray(doc.rawValues) && (doc.rawValues.length === 15 || doc.rawValues.length === 17);
          const ref = doc.bookingRef || (is15or17 ? doc.rawValues?.[0] : doc.rawValues?.[11]);
          const vehicle = doc.vehicle || (is15or17 ? doc.rawValues?.[5] : doc.rawValues?.[7]);
          return {
            ref: ref ? ref.toString().trim() : "",
            vehicle: vehicle ? vehicle.toString().trim() : "",
            startMeter: parseNum(is15or17 ? doc.rawValues?.[10] : doc.rawValues?.[54]),
            endMeter: parseNum(is15or17 ? doc.rawValues?.[11] : doc.rawValues?.[57])
          };
        })
        .filter(item => item.ref && item.ref !== "N/A" && item.ref !== "");

      const seen = new Set(tripRefs.map(t => t.ref));
      for (const f of fallbackRefs) {
        if (!seen.has(f.ref)) {
          tripRefs.push(f);
          seen.add(f.ref);
        }
      }
    } catch (accountError) {
      console.error("AccountSheet fallback skipped:", accountError);
    }

    // 3. Exclude any trip refs already submitted as an FR trip in MongoDB
    const allTripsInDb = await Trip.find(
      { status: { $not: { $regex: /^cancelled$/i } } },
      { reference: 1, rawValues: 1, tripRef: 1, bookingRef: 1 }
    ).lean();
    const usedTripRefs = new Set<string>();
    for (const t of allTripsInDb as any[]) {
      if (t.reference) usedTripRefs.add(String(t.reference).trim());
      const r12 = t.rawValues && t.rawValues[12] ? String(t.rawValues[12]).trim() : '';
      if (r12) usedTripRefs.add(r12);
      if (t.tripRef) usedTripRefs.add(String(t.tripRef).trim());
      if (t.bookingRef) usedTripRefs.add(String(t.bookingRef).trim());
    }
    const filteredTripRefs = tripRefs.filter((item: any) => {
      const refStr = item?.ref ? item.ref.toString().trim() : '';
      return refStr && !usedTripRefs.has(refStr);
    });

    // 4. Pending trips (FR refs) for this driver from MongoDB
    const tripsInDb = await Trip.find(
      { driverId: { $regex: new RegExp(`^${drvId}$`, "i") } },
      { images: 0 },
      { sort: { updatedAt: -1 }, allowDiskUse: true }
    ).lean() as any[];

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
