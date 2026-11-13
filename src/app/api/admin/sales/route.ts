import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import User from "@/models/User";
import SheetMetadata from "@/models/SheetMetadata";
import DriverAdjustment from "@/models/DriverAdjustment";
import AccountSheet from "@/models/AccountSheet";
import BankReceipt from "@/models/BankReceipt";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LAK_BASE_URL = process.env.LAKMOBILE_API_BASE_URL || process.env.BOOKING_API_BASE_URL || "https://senuportal.lakmobile.com";
const LAK_USERNAME = process.env.LAKMOBILE_API_USER || process.env.BOOKING_API_USER || "vconnect-senu-ext-prod";
const LAK_PASSWORD = process.env.LAKMOBILE_API_PASS || process.env.BOOKING_API_PASS || "YKExtprodKH8988!202897SAM";
const LAK_TENANT = process.env.LAKMOBILE_API_TENANT || process.env.BOOKING_API_TENANT || "vconnect";

function getLakAuthHeader(): string {
  const credentials = `${LAK_USERNAME}:${LAK_PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function isLakBookingCredit(b: any): boolean {
  if (!b) return false;
  const payType = String(b.paymentType ?? "").trim().toUpperCase();
  const settleType = String(b.settlementType ?? "").trim().toUpperCase();
  return (
    payType === "CP" ||
    payType === "CREDIT" ||
    settleType === "CREDIT" ||
    Boolean(b.isCorporate)
  );
}

async function fetchLakMobileCreditRefSet(tripsForPage: any[]): Promise<Set<string>> {
  const creditSet = new Set<string>();
  try {
    const hireRefs = Array.from(
      new Set(
        (tripsForPage || [])
          .filter((t: any) => String(t?.purpose || t?.rawValues?.[5] || "").trim() === "Hire")
          .map((t: any) => String(t?.rawValues?.[12] || "").trim().toUpperCase())
          .filter(Boolean)
      )
    );
    if (hireRefs.length === 0) return creditSet;

    const now = new Date();
    let minTime = now.getTime() - 60 * 24 * 60 * 60 * 1000;
    let maxTime = now.getTime() + 2 * 24 * 60 * 60 * 1000;

    (tripsForPage || []).forEach((t: any) => {
      [t?.rawValues?.[6], t?.rawValues?.[7], t?.timestamp].forEach((dtVal: any) => {
        if (!dtVal) return;
        const dateStr = String(dtVal).split("T")[0].split(" ")[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const parsed = new Date(`${dateStr}T00:00:00`).getTime();
          if (!isNaN(parsed)) {
            const paddedMin = parsed - 14 * 24 * 60 * 60 * 1000;
            const paddedMax = parsed + 3 * 24 * 60 * 60 * 1000;
            if (paddedMin < minTime) minTime = paddedMin;
            if (paddedMax > maxTime) maxTime = paddedMax;
          }
        }
      });
    });

    const fromStr = new Date(minTime).toISOString().split("T")[0];
    const toStr = new Date(maxTime).toISOString().split("T")[0];
    const baseUrlClean = LAK_BASE_URL.replace(/\/+$/, "");
    const authHeader = getLakAuthHeader();

    const seenIds = new Set<string>();
    const listUrl = `${baseUrlClean}/api/ext/bookings?from=${fromStr}&to=${toStr}`;
    const res = await fetch(listUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "customer-reference": LAK_TENANT,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const bookings = Array.isArray(data?.dataBundle) ? data.dataBundle : [];
      bookings.forEach((b: any) => {
        const idStr = String(b?.id ?? "").trim().toUpperCase();
        if (!idStr) return;
        seenIds.add(idStr);
        if (isLakBookingCredit(b)) {
          creditSet.add(idStr);
        }
      });
    }

    const unmatchedNumericRefs = hireRefs.filter((r) => /^\d+$/.test(r) && !seenIds.has(r)).slice(0, 20);
    if (unmatchedNumericRefs.length > 0) {
      await Promise.all(
        unmatchedNumericRefs.map(async (ref) => {
          try {
            const detRes = await fetch(`${baseUrlClean}/api/ext/bookings/${encodeURIComponent(ref)}`, {
              method: "GET",
              headers: {
                Authorization: authHeader,
                "customer-reference": LAK_TENANT,
                Accept: "application/json",
              },
              cache: "no-store",
            });
            if (!detRes.ok) return;
            const detData = await detRes.json().catch(() => null);
            if (isLakBookingCredit(detData?.dataBundle)) {
              creditSet.add(ref);
            }
          } catch {
            // Ignore individual booking lookup failures
          }
        })
      );
    }
  } catch (err) {
    console.error("Error fetching Lak Mobile bookings for credit hire check:", err);
  }
  return creditSet;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const purposeFilter = searchParams.get("purpose");
  const statusFilter = searchParams.get("status");
  const vehicleFilter = searchParams.get("vehicle");
  const driverFilter = searchParams.get("driver");
  const search = searchParams.get("search");

  try {
    await dbConnect();

    // Base query conditions (dates, purpose, vehicle, driver)
    const baseQuery: any = {};
    const baseConditions: any[] = [];

    if (startDate || endDate) {
      const dateCond: any = {};
      if (startDate) dateCond.$gte = startDate;
      if (endDate) dateCond.$lte = endDate + " 23:59:59";
      
      baseConditions.push({
        $or: [
          { "rawValues.7": dateCond },
          { 
            $and: [
              { "rawValues.7": { $in: [null, ""] } },
              { timestamp: dateCond }
            ]
          }
        ]
      });
    }
    if (purposeFilter && purposeFilter !== "All") baseQuery.purpose = purposeFilter;
    if (vehicleFilter && vehicleFilter !== "All") baseQuery.vehicle = vehicleFilter;
    if (driverFilter && driverFilter !== "All") baseQuery.driverId = driverFilter;

    // Build query (used for KPIs, charts, revenue/sales analytics)
    const query: any = { ...baseQuery };
    const queryAnd: any[] = [...baseConditions];

    // Build fleetQuery (used for the Complete Fleet Data table and its pagination)
    const fleetQuery: any = { ...baseQuery };
    const fleetAnd: any[] = [...baseConditions];

    if (statusFilter && statusFilter !== "All") {
      let statusCond: any[];
      if (statusFilter.toLowerCase().includes("cancel")) {
        statusCond = [
          { status: { $regex: /cancel/i } },
          { "rawValues.0": { $regex: /cancel/i } }
        ];
      } else {
        const regex = new RegExp(`^${statusFilter}$`, "i");
        statusCond = [
          { status: regex },
          { "rawValues.0": regex }
        ];
      }
      queryAnd.push({ $or: statusCond });
      fleetAnd.push({ $or: statusCond });
    } else {
      // By default in KPIs / analytics, exclude cancelled trips so metrics reflect active/completed trips
      query.status = { $not: /cancel/i };
      query["rawValues.0"] = { $not: /cancel/i };
      // fleetQuery has NO status filter when status is "All", so ALL trips (including Cancelled) appear in Fleet Data table
    }

    if (queryAnd.length > 0) {
      query.$and = queryAnd;
    }

    // Build fleetQuery specifically for Fleet Data table searching
    if (search) {
      const searchRegex = new RegExp(search, "i");
      const searchConditions: any[] = [
        { reference: searchRegex },
        { vehicle: searchRegex },
        { driverId: searchRegex },
        { status: searchRegex },
        { purpose: searchRegex },
        { rawValues: searchRegex }
      ];

      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        searchConditions.push({ rawValues: searchNum });
      }

      fleetAnd.push({ $or: searchConditions });
    }

    if (fleetAnd.length > 0) {
      fleetQuery.$and = fleetAnd;
    }

    // Pagination setup
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Run parallel queries to optimize performance
    const [
      totalItems,
      tripsForPage,
      recentTripsRaw,
      kpiAggregation,
      chartsAggregation,
      uniqueVehicles,
      uniqueDrivers,
      users,
      addedVehiclesMeta,
      allTripsRaw,
      allBankReceipts
    ] = await Promise.all([
      Trip.countDocuments(fleetQuery),
      Trip.find(fleetQuery, { 'images.dataUrl': 0 }).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      Trip.find(query, { images: 0, rawValues: 0 }).sort({ timestamp: -1 }).limit(10).lean(),
      Trip.aggregate([
        { $match: query },
        { $group: {
            _id: null,
            totalSales: { $sum: "$finalPrice" },
            totalCommission: { $sum: "$commission" },
            totalFuel: { $sum: "$fuel" },
            totalRepairCost: { $sum: "$repair" },
            totalMileage: { $sum: "$mileage" },
            hireCount: { $sum: { $cond: [{ $eq: ["$purpose", "Hire"] }, 1, 0] } },
            repairCount: { $sum: { $cond: [{ $eq: ["$purpose", "Repair"] }, 1, 0] } }
          }
        }
      ]),
      Trip.aggregate([
        { $match: query },
        {
          $facet: {
            byDate: [
              {
                $group: {
                  _id: { $substrBytes: [{ $toString: { $ifNull: [{ $arrayElemAt: ["$rawValues", 7] }, "Unknown   "] } }, 0, 10] },
                  sales: { $sum: "$finalPrice" }
                }
              },
              { $sort: { _id: 1 } }
            ],
            byVehicle: [
              {
                $group: {
                  _id: { $ifNull: ["$vehicle", "Unknown"] },
                  sales: { $sum: "$finalPrice" },
                  hireIncome: { $sum: { $cond: [{ $eq: ["$purpose", "Hire"] }, "$finalPrice", 0] } },
                  hireCount: { $sum: { $cond: [{ $eq: ["$purpose", "Hire"] }, 1, 0] } },
                  totalMileage: { $sum: "$mileage" },
                  personalMileage: { $sum: { $cond: [{ $eq: ["$purpose", "Personal"] }, "$mileage", 0] } },
                  fuelCost: { $sum: "$fuel" },
                  scDue: { $sum: "$scDue" },
                  drvComm: { $sum: "$commission" },
                  repairCost: { $sum: "$repair" }
                }
              },
              { $sort: { _id: 1 } }
            ],
            byDriver: [
              {
                $group: {
                  _id: { $ifNull: ["$driverId", "Unknown"] },
                  sales: { $sum: "$finalPrice" }
                }
              },
              { $sort: { sales: -1 } }
            ],
            byMonth: [
              {
                $group: {
                  _id: { $substrBytes: [{ $toString: { $ifNull: [{ $arrayElemAt: ["$rawValues", 7] }, "Unknown   "] } }, 0, 7] },
                  sales: { $sum: "$finalPrice" }
                }
              },
              { $sort: { _id: 1 } }
            ],
            byPurpose: [
              {
                $group: {
                  _id: {
                    $cond: [
                      { $in: ["$purpose", ["Hire", "Repair"]] },
                      "$purpose",
                      "Other"
                    ]
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),
      Trip.distinct("vehicle"),
      Trip.distinct("driverId"),
      User.find({}, { username: 1, name: 1, password: 1, phone: 1, role: 1, status: 1 }).lean(),
      SheetMetadata.findOne({ key: "added_vehicles" }).lean(),
      Trip.find(query, { rawValues: 1, vehicle: 1, status: 1, finalPrice: 1, purpose: 1 }).lean(),
      BankReceipt.find({}, { reference: 1, tripRef: 1, status: 1, receiptValue: 1, imageName: 1 }).lean().catch(() => [])
    ]);

    // KPI mapping
    const kpis = kpiAggregation[0] || {
      totalSales: 0,
      totalCommission: 0,
      totalFuel: 0,
      totalRepairCost: 0,
      totalMileage: 0,
      hireCount: 0,
      repairCount: 0
    };

    let totalFuelLiters = 0;
    const fuelLitersByVehicle: Record<string, number> = {};
    (allTripsRaw || []).forEach((t: any) => {
      const values = t.rawValues || [];
      const status = String(values[0] || t.status || '').toLowerCase();
      if (status.includes('cancel')) return;

      const veh = t.vehicle || values[4] || "Unknown";
      let tripLiters = 0;

      const rawComments = String(values[10] || '');
      const fuelMatches: any[] = Array.from(rawComments.matchAll(/\(Fuel - (.*?)\)/g));
      if (fuelMatches.length > 0) {
        const fuelStr = fuelMatches[fuelMatches.length - 1][1];
        const m = fuelStr.match(/Liters:\s*([\d.]+)/i);
        if (m) {
          tripLiters += parseFloat(m[1]) || 0;
        }
      }
      const secondLiters = parseFloat(values[26]);
      if (!isNaN(secondLiters)) {
        tripLiters += secondLiters;
      }

      totalFuelLiters += tripLiters;
      if (tripLiters > 0 && veh) {
        fuelLitersByVehicle[veh] = (fuelLitersByVehicle[veh] || 0) + tripLiters;
      }
    });

    const tripRefs = (allTripsRaw || []).map((t: any) => String(t.rawValues?.[12] || '').trim()).filter(Boolean);
    const accountData = tripRefs.length > 0
      ? await AccountSheet.find(
          {
            $or: [
              { bookingRef: { $in: tripRefs } },
              { "rawValues.11": { $in: tripRefs } }
            ]
          },
          { bookingRef: 1, rawValues: 1 }
        ).lean()
      : [];
    const accountTypeMap = new Map();
    accountData.forEach((acc: any) => {
        const hireType = String(acc.rawValues?.[31] || '').trim().toLowerCase();
        const bRef = String(acc.bookingRef || '').trim();
        if (bRef && tripRefs.includes(bRef)) {
            accountTypeMap.set(bRef, hireType);
        } else if (acc.rawValues && Array.isArray(acc.rawValues)) {
            const matchedRef = tripRefs.find(r => acc.rawValues.some((v: any) => String(v || '').trim() === r));
            if (matchedRef) {
                accountTypeMap.set(matchedRef, hireType);
            }
        }
    });

    const incomeByVehicle: Record<string, { cash: number, credit: number, cashCount: number, creditCount: number, cashScDue: number, creditScDue: number }> = {};
    (allTripsRaw || []).forEach((t: any) => {
      const status = String(t.rawValues?.[0] || t.status || '').toLowerCase();
      if (status.includes('cancel')) return;
      const purpose = String(t.rawValues?.[5] || t.purpose || '');
      if (purpose !== 'Hire') return;

      const veh = t.vehicle || t.rawValues?.[4] || "Unknown";
      const tripRef = String(t.rawValues?.[12] || '').trim();
      const price = parseFloat(t.finalPrice || t.rawValues?.[23] || 0) || 0;
      const scDueStr = String(t.rawValues?.[13] || '0').replace(/[^\d.-]/g, '');
      const scDue = Number(scDueStr) || 0;
      
      const type = accountTypeMap.get(tripRef) || 'cash';
      if (!incomeByVehicle[veh]) incomeByVehicle[veh] = { cash: 0, credit: 0, cashCount: 0, creditCount: 0, cashScDue: 0, creditScDue: 0 };
      if (type === 'credit') {
         incomeByVehicle[veh].credit += price;
         incomeByVehicle[veh].creditCount += 1;
         incomeByVehicle[veh].creditScDue += scDue;
      } else {
         incomeByVehicle[veh].cash += price;
         incomeByVehicle[veh].cashCount += 1;
         incomeByVehicle[veh].cashScDue += scDue;
      }
    });

    const netIncome = (kpis.totalSales || 0) - (kpis.totalCommission || 0) - (kpis.totalFuel || 0) - (kpis.totalRepairCost || 0);

    // Charts mapping
    const chartsData = chartsAggregation[0];
    const dailySales = chartsData.byDate.map((d: any) => ({ date: d._id, sales: d.sales }));
    const allSystemVehicles = Array.from(new Set(["PK-3991", ...uniqueVehicles.filter(Boolean), ...(addedVehiclesMeta?.value || [])])).filter(Boolean);
    const vehicleSalesMap = new Map<string, any>();

    chartsData.byVehicle.forEach((d: any) => {
      if (!d._id) return;
      const incomeData = incomeByVehicle[d._id] || { cash: 0, credit: 0, cashCount: 0, creditCount: 0 };
      vehicleSalesMap.set(d._id, {
        vehicle: d._id,
        sales: d.sales || 0,
        hireIncome: d.hireIncome || 0,
        hireCount: d.hireCount || 0,
        cashIncome: incomeData.cash || 0,
        creditIncome: incomeData.credit || 0,
        cashHireCount: incomeData.cashCount || 0,
        creditHireCount: incomeData.creditCount || 0,
        cashScDue: incomeData.cashScDue || 0,
        creditScDue: incomeData.creditScDue || 0,
        mileage: d.totalMileage || 0,
        personalMileage: d.personalMileage || 0,
        fuelCost: d.fuelCost || 0,
        fuelLiters: fuelLitersByVehicle[d._id] || 0,
        incomePerKm: d.totalMileage > 0 ? (d.hireIncome / d.totalMileage) : 0,
        fuelPercentage: (() => {
          if (!d.hireIncome) return 0;
          const costPerKm = (d.totalMileage || 0) > 0 ? (d.fuelCost || 0) / d.totalMileage : 0;
          const personalFuelCost = (d.personalMileage || 0) * costPerKm;
          const adjustedFuelCost = (d.fuelCost || 0) - personalFuelCost;
          return (adjustedFuelCost / d.hireIncome) * 100;
        })(),
        scDue: d.scDue || 0
      });
    });

    allSystemVehicles.forEach((v: string) => {
      if (!vehicleSalesMap.has(v)) {
        vehicleSalesMap.set(v, {
          vehicle: v,
          sales: 0,
          hireIncome: 0,
          hireCount: 0,
          cashIncome: 0,
          creditIncome: 0,
          cashHireCount: 0,
          creditHireCount: 0,
          cashScDue: 0,
          creditScDue: 0,
          mileage: 0,
          personalMileage: 0,
          fuelCost: 0,
          fuelLiters: 0,
          incomePerKm: 0,
          fuelPercentage: 0,
          scDue: 0
        });
      }
    });

    const vehicleSales = Array.from(vehicleSalesMap.values());
    vehicleSales.sort((a: any, b: any) => a.vehicle.localeCompare(b.vehicle));
    const driverSales = chartsData.byDriver.map((d: any) => ({ driver: d._id, sales: d.sales }));
    const monthlySales = chartsData.byMonth.map((d: any) => ({ month: d._id, sales: d.sales }));
    
    const purposeDataMap: any = { Hire: 0, Repair: 0, Other: 0 };
    chartsData.byPurpose.forEach((d: any) => {
        if (d._id) purposeDataMap[d._id] = d.count;
    });
    const purposeCount = Object.keys(purposeDataMap).map(purpose => ({ purpose, count: purposeDataMap[purpose] }));

    const bankReceiptMap = new Map<string, any>();
    (allBankReceipts || []).forEach((br: any) => {
      if (br.reference) bankReceiptMap.set(String(br.reference).trim().toUpperCase(), br);
      if (br.tripRef) bankReceiptMap.set(String(br.tripRef).trim().toUpperCase(), br);
    });

    const lakCreditRefSet = await fetchLakMobileCreditRefSet(tripsForPage);

    // Format Fleet Data for the current page
    const fleetData = tripsForPage.map((trip: any) => {
      const matchedReceipt = bankReceiptMap.get(String(trip.reference || '').trim().toUpperCase()) ||
        bankReceiptMap.get(String(trip.rawValues?.[12] || '').trim().toUpperCase());
      const tripRefUpper = String(trip.rawValues?.[12] || '').trim().toUpperCase();
      const isHire = String(trip.purpose || trip.rawValues?.[5] || '').trim() === 'Hire';
      const isCreditHire = isHire && Boolean(tripRefUpper && lakCreditRefSet.has(tripRefUpper));
      return {
      rf: trip.reference,
      date: trip.rawValues?.[7] || trip.timestamp,
      driver: trip.driverId,
      vehicle: trip.vehicle,
      purpose: trip.purpose,
      status: trip.status,
      paymentType: isCreditHire ? 'credit' : (accountTypeMap.get(String(trip.rawValues?.[12] || '').trim()) || 'cash'),
      isCreditHire,
      repairMeter: trip.repairMeter || trip.rawValues?.[35] || '',
      values: trip.rawValues || [],
      images: (trip.images || []).map((img: any) => ({ name: img.name, id: img._id })),
      imageCount: (trip.images || []).length,
      paymentStatus: matchedReceipt?.status || trip.paymentStatus || '',
      paymentValue: matchedReceipt?.receiptValue || 0,
    };});

    // Format Recent Trips
    const recentTrips = recentTripsRaw.map((trip: any) => ({
      rf: trip.reference,
      date: trip.rawValues?.[7] || trip.timestamp,
      driver: trip.driverId,
      vehicle: trip.vehicle,
      purpose: trip.purpose,
      status: trip.status,
      scDue: trip.scDue,
      comms: trip.commission,
      fuel: trip.fuel,
      repair: trip.repair,
      mileage: trip.mileage,
      finalPrice: trip.finalPrice
    }));

    // Format Drivers
    const driverNames: Record<string, string> = {};
    const driversList = users.map((u: any) => {
      const uName = String(u.name ?? '').trim();
      if (u.username && uName) {
        driverNames[String(u.username)] = uName;
        driverNames[String(u.username).trim().toUpperCase()] = uName;
      }
      return {
        username: u.username,
        password: u.password,
        name: u.name,
        phone: u.phone,
        role: u.role || 'Driver',
        status: u.status || 'Active'
      };
    });

    const salaryMap = new Map();
    (allTripsRaw || []).forEach((t: any) => {
      const values = t.rawValues || [];
      const status = String(values[0] || '').toLowerCase();
      if (status.includes('cancel')) return;

      const purpose = String(values[5] || '');
      if (purpose !== 'Hire') return;

      const driverCode = String(values[3] || '');
      if (!driverCode) return;

      const tripRef = String(values[12] || '');
      const rawCommStr = String(values[14] || '0');
      const tripEndDateStr = String(values[7] || '');

      let month = 'Unknown';
      if (tripEndDateStr && tripEndDateStr.length >= 7 && /^\d{4}-\d{2}/.test(tripEndDateStr)) {
        month = tripEndDateStr.substring(0, 7);
      } else if (t.timestamp && String(t.timestamp).length >= 7 && /^\d{4}-\d{2}/.test(String(t.timestamp))) {
        month = String(t.timestamp).substring(0, 7);
      } else if (t.createdAt) {
        const d = new Date(t.createdAt);
        if (!isNaN(d.getTime())) {
          month = d.toISOString().substring(0, 7);
        }
      }

      const rawComm = rawCommStr.replace(/[^\d.-]/g, '');
      const comm = parseFloat(rawComm) || 0;

      const key = `${driverCode}_${month}`;
      if (!salaryMap.has(key)) {
        salaryMap.set(key, { 
          key, 
          driverCode, 
          driverName: driverNames[driverCode] || driverNames[driverCode.trim().toUpperCase()] || driverCode, 
          month, 
          baseComm: 0,
          salaryAdvance: 0, 
          shorts: 0, 
          excess: 0,
          inclusions: 0,
          exclusions: 0,
          totalComm: 0, 
          trips: [] 
        });
      }

      salaryMap.get(key).baseComm += comm;
      salaryMap.get(key).trips.push({ tripRef, tripEndDate: tripEndDateStr, comm: rawCommStr || '0' });
    });
    
    const adjustments = await DriverAdjustment.find({});
    const adjMap = new Map();
    adjustments.forEach((adj: any) => {
      adjMap.set(`${adj.driverCode}_${adj.month}`, adj);
    });

    const salaryData = Array.from(salaryMap.values()).map((item: any) => {
      const adj = adjMap.get(item.key);
      const salaryAdvance = adj ? adj.salaryAdvance || 0 : 0;
      const shorts = adj ? adj.shorts || 0 : 0;
      const excess = adj ? adj.excess || 0 : 0;
      const inclusions = adj ? adj.inclusions || 0 : 0;
      const exclusions = adj ? adj.exclusions || 0 : 0;
      const comment = adj ? adj.comment || "" : "";
      const exclusionsComment = adj ? adj.exclusionsComment || "" : "";
      const baseComm = item.baseComm || 0;
      const totalComm = baseComm - salaryAdvance - shorts + excess + inclusions - exclusions;

      return {
        ...item,
        baseComm,
        salaryAdvance,
        shorts,
        excess,
        inclusions,
        exclusions,
        comment,
        exclusionsComment,
        totalComm
      };
    });

    const filteredSalaryData = salaryData.filter((item: any) => {
      if (item.month === 'Unknown' && (item.baseComm === 0 || item.trips.length === 0) && item.totalComm === 0) {
        return false;
      }
      return true;
    });

    filteredSalaryData.sort((a: any, b: any) => b.month.localeCompare(a.month) || a.driverCode.localeCompare(b.driverCode));

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      kpis: {
        totalSales: kpis.totalSales || 0,
        totalCommission: kpis.totalCommission || 0,
        netIncome,
        hireCount: kpis.hireCount || 0,
        repairCount: kpis.repairCount || 0,
        totalMileage: kpis.totalMileage || 0,
        totalFuel: kpis.totalFuel || 0,
        totalRepairCost: kpis.totalRepairCost || 0,
        totalFuelLiters: totalFuelLiters || 0
      },
      charts: {
        dailySales,
        vehicleSales,
        driverSales,
        purposeCount,
        monthlySales
      },
      tables: {
        topVehicles: vehicleSales,
        topDrivers: driverSales.slice(0, 10),
        recentTrips,
        fleetData,
        driversList,
        salaryData: filteredSalaryData
      },
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      },
      driverNames,
      filterOptions: {
        vehicles: allSystemVehicles,
        drivers: uniqueDrivers.filter(Boolean),
        purposes: ["All", "Hire", "Repair", "Personal", "Fuel", "Office Use"],
        statuses: ["All", "Approved", "Pending", "Cancelled"]
      }
    });
  } catch (error: any) {
    console.error("Admin sales API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
