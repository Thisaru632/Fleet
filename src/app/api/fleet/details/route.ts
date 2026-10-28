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

// Fetch single booking detail directly from Lak Mobile
async function fetchBookingDetailFromLakMobile(id: string): Promise<any> {
  try {
    const detailUrl = `${BASE_URL.replace(/\/+$/, '')}/api/ext/bookings/${encodeURIComponent(id)}`;
    const res = await fetch(detailUrl, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'customer-reference': TENANT,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.dataBundle || null;
  } catch (err) {
    console.error("Error fetching booking detail from Lak Mobile:", err);
    return null;
  }
}

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
      const trimmedRef = ref.trim();

      // 1. Try direct fetch from Lak Mobile live API first
      const detail = await fetchBookingDetailFromLakMobile(trimmedRef);
      if (detail) {
        const bookingRef = String(detail.id);
        const vehicleType = detail.cabType || detail?.vehicle?.modelCategory || "";
        
        const startMeter = detail?.meterReading?.startKm !== null && detail?.meterReading?.startKm !== undefined
          ? detail.meterReading.startKm
          : 0;
        const endMeter = detail?.meterReading?.endKm !== null && detail?.meterReading?.endKm !== undefined
          ? detail.meterReading.endKm
          : 0;

        const fb = detail?.payment?.fareBreakdown || detail?.fareBreakdown;

        const pkgAllowance = (fb?.packageKm !== null && fb?.packageKm !== undefined)
          ? Number(fb.packageKm)
          : ((Number(detail?.initialKm) || 0) + (Number(detail?.addKm) || 0));

        const runDistance = (fb?.actualKm !== null && fb?.actualKm !== undefined)
          ? Number(fb.actualKm)
          : (detail?.meterReading?.endKm !== null && detail?.meterReading?.endKm !== undefined && detail?.meterReading?.startKm !== null && detail?.meterReading?.startKm !== undefined && Number(detail.meterReading.endKm) >= Number(detail.meterReading.startKm))
          ? (Number(detail.meterReading.endKm) - Number(detail.meterReading.startKm))
          : (detail?.payment?.distanceKm !== null && detail?.payment?.distanceKm !== undefined ? Number(detail.payment.distanceKm) : 0);

        const finalTotal = detail?.payment?.totalAmount ?? detail?.finalTotal ?? detail?.amount ?? 0;
        const driverMisc = detail?.payment?.driverMiscTotal || 0;
        const staffMisc = detail?.payment?.callCenterMiscAmount || 0;
        const miscExpenses = driverMisc + staffMisc;
        const finalPrice = Math.max(0, finalTotal - miscExpenses);

        const tripStatus = detail.status || "Assigned";
        const driverCode = detail.driver?.driverId || detail.driverId || "";

        const picktime = detail.picktime || detail.createdAt || "";
        const startDate = picktime.includes('T') ? picktime.split('T')[0] : (picktime.split(' ')[0] || "");
        const startTime = picktime.includes('T') ? picktime.split('T')[1].substring(0, 5) : (picktime.split(' ')[1] || "");

        const passengerCount = detail.passengerCount ? String(detail.passengerCount) : "";
        const pickupStreet = detail.tripStops?.[0]?.address || "";
        const dropoffStreet = detail.tripStops?.[1]?.address || detail.pickDropBrief || "";
        const journeyType = detail.hireNature || "";
        const paymentType = detail.paymentType || detail.settlementType || "";

        // Build exact 60-element legacy array for driver interface
        const expanded = new Array(60).fill("");
        expanded[0] = tripStatus;
        expanded[4] = finalPrice;
        expanded[9] = driverCode;
        expanded[11] = bookingRef;
        expanded[13] = startDate;
        expanded[14] = startTime;
        expanded[17] = vehicleType;
        expanded[18] = passengerCount;
        expanded[24] = pickupStreet;
        expanded[25] = dropoffStreet;
        expanded[30] = journeyType;
        expanded[32] = paymentType;
        expanded[33] = pkgAllowance;
        expanded[54] = startMeter;
        expanded[57] = endMeter;
        expanded[58] = runDistance;

        return NextResponse.json({ details: expanded });
      }

      // 2. Fallback to MongoDB AccountSheet if Lak Mobile didn't return detail
      const accountDoc = await AccountSheet.findOne({
        $or: [
          { bookingRef: trimmedRef },
          { rawValues: trimmedRef }
        ]
      });

      if (!accountDoc) {
        return NextResponse.json({ details: null });
      }

      const raw = accountDoc.rawValues || [];
      if (Array.isArray(raw) && (raw.length === 15 || raw.length === 17)) {
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
        if (trip.repairMeter) row[35] = trip.repairMeter;
        return NextResponse.json({ details: row });
      }

      if (trip.repairMeter && !details[35]) {
        while (details.length <= 35) details.push('');
        details[35] = trip.repairMeter;
      }

      return NextResponse.json({ details });
    }
  } catch (error: any) {
    console.error("Error fetching details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
