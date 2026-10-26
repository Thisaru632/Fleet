import AccountSheet from "@/models/AccountSheet";
import SheetMetadata from "@/models/SheetMetadata";
import dbConnect from "./mongodb";

export const ACCOUNT_SHEET_HEADERS = [
  "Booking Ref",
  "Start Date",
  "end date",
  "end date",
  "End Time",
  "Vehicle Type",
  "No of pax",
  "Pick up Street",
  "Drop off Str / Pick up City",
  "Journey Type",
  "Start Meter",
  "End Meter",
  "No. of KMs",
  "Distance",
  "Final Price",
  "Trip Status",
  "Driver Code"
];

const BASE_URL = process.env.LAKMOBILE_API_BASE_URL || process.env.BOOKING_API_BASE_URL || 'https://senuportal.lakmobile.com';
const USERNAME = process.env.LAKMOBILE_API_USER || process.env.BOOKING_API_USER || 'vconnect-senu-ext-prod';
const PASSWORD = process.env.LAKMOBILE_API_PASS || process.env.BOOKING_API_PASS || 'YKExtprodKH8988!202897SAM';
const TENANT = process.env.LAKMOBILE_API_TENANT || process.env.BOOKING_API_TENANT || 'vconnect';

function getAuthHeader(): string {
  const credentials = `${USERNAME}:${PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

// Fetch single booking detail from Lak Mobile
async function fetchBookingDetail(id: number | string): Promise<any> {
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
    return null;
  }
}

// Helper to run promises with concurrency limit
async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = await fn(items[current]);
      } catch (err) {
        results[current] = null as any;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function runAccountSync() {
  await dbConnect();

  // Save the 15 requested columns to SheetMetadata
  await SheetMetadata.findOneAndUpdate(
    { key: "account_sheet_headers" },
    { value: ACCOUNT_SHEET_HEADERS },
    { upsert: true }
  );

  // Date range: 60 days in past to today
  const now = new Date();
  const toStr = now.toISOString().split('T')[0];
  const fromDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const fromStr = fromDate.toISOString().split('T')[0];

  const listUrl = `${BASE_URL.replace(/\/+$/, '')}/api/ext/bookings?from=${fromStr}&to=${toStr}`;
  const res = await fetch(listUrl, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
      'customer-reference': TENANT,
      'Accept': 'application/json'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch bookings from Lak Mobile: ${res.status} ${res.statusText}`);
  }

  const listData = await res.json();
  const bookings = Array.isArray(listData.dataBundle) ? listData.dataBundle : [];

  if (bookings.length === 0) {
    return {
      success: true,
      message: "No bookings found in Lak Mobile for the date range.",
      count: 0
    };
  }

  // Fetch details concurrently with limit of 10
  const details = await mapConcurrent(bookings, 10, async (b: any) => {
    return await fetchBookingDetail(b.id);
  });

  let upsertedCount = 0;

  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    const detail = details[i];

    const bookingRef = String(b.id);
    const vehicleType = b.cabType || detail?.cabType || detail?.vehicle?.modelCategory || "";
    
    // Meter readings
    const startMeter = detail?.meterReading?.startKm !== null && detail?.meterReading?.startKm !== undefined
      ? detail.meterReading.startKm
      : 0;
    const endMeter = detail?.meterReading?.endKm !== null && detail?.meterReading?.endKm !== undefined
      ? detail.meterReading.endKm
      : 0;

    // Run Distance section: Pkg allowance & Run Distance
    const pkgAllowance = detail?.payment?.fareBreakdown?.packageKm ?? detail?.initialKm ?? b.initialKm ?? 0;
    const runDistance = detail?.payment?.fareBreakdown?.actualKm ?? detail?.payment?.distanceKm ?? 0;

    // Final Price: Final Total - Misc Expenses
    const finalTotal = detail?.payment?.totalAmount ?? detail?.finalTotal ?? b.finalTotal ?? b.subTotal ?? b.amount ?? 0;
    const driverMisc = detail?.payment?.driverMiscTotal || 0;
    const staffMisc = detail?.payment?.callCenterMiscAmount || 0;
    const miscExpenses = driverMisc + staffMisc;
    const finalPrice = Math.max(0, finalTotal - miscExpenses);

    // The exact 15 columns requested:
    // 0: Booking Ref (from ID)
    // 1: Start Date (keep empty)
    // 2: end date (keep empty)
    // 3: end date (keep empty)
    // 4: End Time (keep empty)
    // 5: Vehicle Type (Assigned Vehicle section cab field)
    // 6: No of pax (keep empty)
    // 7: Pick up Street (keep empty)
    // 8: Drop off Str / Pick up City (keep empty)
    // 9: Journey Type (keep empty)
    // 10: Start Meter (Start Odometer)
    // 11: End Meter (End Odometer)
    // 12: No. of KMs (Pkg allowance in Run Distance section)
    // 13: Distance (Run Distance)
    // 14: Final Price (Final Total - Misc Expenses)
    // 15: Trip Status
    // 16: Driver Code
    const tripStatus = b.status || detail?.status || "Assigned";
    const driverCode = b.driverId || detail?.driver?.driverId || "";

    const rawValues = [
      bookingRef,
      "",
      "",
      "",
      "",
      vehicleType,
      "",
      "",
      "",
      "",
      startMeter,
      endMeter,
      pkgAllowance,
      runDistance,
      finalPrice,
      tripStatus,
      driverCode
    ];

    const picktime = b.picktime || detail?.picktime || b.createdAt || detail?.createdAt;
    const dateObj = picktime ? new Date(picktime) : new Date();

    await AccountSheet.updateOne(
      { bookingRef },
      {
        $set: {
          date: isNaN(dateObj.getTime()) ? new Date() : dateObj,
          bookingRef,
          driverId: b.driverId || detail?.driver?.driverId || "",
          vehicle: b.vehiclePlate || detail?.vehicle?.plateNo || "",
          status: b.status || detail?.status || "Assigned",
          rawValues
        }
      },
      { upsert: true }
    );
    upsertedCount++;
  }

  return {
    success: true,
    message: `Account Sheet synced from Lak Mobile: ${upsertedCount} bookings populated with 15 columns.`,
    count: upsertedCount
  };
}
