import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import User from "@/models/User";
import SheetMetadata from "@/models/SheetMetadata";
import DriverAdjustment from "@/models/DriverAdjustment";
import AccountSheet from "@/models/AccountSheet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Build query
    const query: any = {};
    const andConditions: any[] = [];

    if (startDate || endDate) {
      const dateCond: any = {};
      if (startDate) dateCond.$gte = startDate;
      if (endDate) dateCond.$lte = endDate + " 23:59:59";
      
      andConditions.push({
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
    if (purposeFilter && purposeFilter !== "All") query.purpose = purposeFilter;
    if (statusFilter && statusFilter !== "All") {
      if (statusFilter.toLowerCase().includes("cancel")) {
        query.$or = [
          { status: { $regex: /cancel/i } },
          { "rawValues.0": { $regex: /cancel/i } }
        ];
      } else {
        query.status = statusFilter;
      }
    } else {
      query.status = { $not: /cancel/i };
      query["rawValues.0"] = { $not: /cancel/i };
    }
    if (vehicleFilter && vehicleFilter !== "All") query.vehicle = vehicleFilter;
    if (driverFilter && driverFilter !== "All") query.driverId = driverFilter;

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Build fleetQuery specifically for Fleet Data table searching
    const fleetQuery: any = { ...query };
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

      const fleetAnd = fleetQuery.$and ? [...fleetQuery.$and] : [];
      fleetAnd.push({ $or: searchConditions });
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
      allTripsRaw
    ] = await Promise.all([
      Trip.countDocuments(fleetQuery),
      Trip.find(fleetQuery, { images: 0 }).sort({ reference: -1 }).skip(skip).limit(limit).lean(),
      Trip.find(query, { images: 0, rawValues: 0 }).sort({ reference: -1 }).limit(10).lean(),
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
                  _id: { $substrBytes: [{ $ifNull: [{ $arrayElemAt: ["$rawValues", 7] }, "Unknown   "] }, 0, 10] },
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
                  _id: { $substrBytes: [{ $ifNull: [{ $arrayElemAt: ["$rawValues", 7] }, "Unknown   "] }, 0, 7] },
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
      Trip.find(query, { rawValues: 1, vehicle: 1, status: 1, finalPrice: 1, purpose: 1 }).lean()
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
      const fuelMatch = rawComments.match(/\(Fuel - (.*?)\)/);
      if (fuelMatch) {
        const fuelStr = fuelMatch[1];
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
    const accountData = await AccountSheet.find({
        $or: [
           { bookingRef: { $in: tripRefs } },
           { rawValues: { $in: tripRefs } }
        ]
    }).lean();
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
    const vehicleSales = chartsData.byVehicle.map((d: any) => {
      const incomeData = incomeByVehicle[d._id] || { cash: 0, credit: 0, cashCount: 0, creditCount: 0 };
      return {
      vehicle: d._id,
      sales: d.sales,
      hireIncome: d.hireIncome || 0,
      hireCount: d.hireCount || 0,
      cashIncome: incomeData.cash,
      creditIncome: incomeData.credit,
      cashHireCount: incomeData.cashCount,
      creditHireCount: incomeData.creditCount,
      cashScDue: incomeData.cashScDue,
      creditScDue: incomeData.creditScDue,
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
    }});
    const driverSales = chartsData.byDriver.map((d: any) => ({ driver: d._id, sales: d.sales }));
    const monthlySales = chartsData.byMonth.map((d: any) => ({ month: d._id, sales: d.sales }));
    
    const purposeDataMap: any = { Hire: 0, Repair: 0, Other: 0 };
    chartsData.byPurpose.forEach((d: any) => {
        if (d._id) purposeDataMap[d._id] = d.count;
    });
    const purposeCount = Object.keys(purposeDataMap).map(purpose => ({ purpose, count: purposeDataMap[purpose] }));

    // Format Fleet Data for the current page
    const fleetData = tripsForPage.map((trip: any) => ({
      rf: trip.reference,
      date: trip.rawValues?.[7] || trip.timestamp,
      driver: trip.driverId,
      vehicle: trip.vehicle,
      purpose: trip.purpose,
      status: trip.status,
      paymentType: accountTypeMap.get(String(trip.rawValues?.[12] || '').trim()) || 'cash',
      values: trip.rawValues || [],
    }));

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
      if (u.username) driverNames[String(u.username)] = String(u.name);
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
          driverName: driverNames[driverCode] || driverCode, 
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
        topVehicles: vehicleSales.slice(0, 10),
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
        vehicles: Array.from(new Set(["PK-3991", ...uniqueVehicles.filter(Boolean), ...(addedVehiclesMeta?.value || [])])),
        drivers: uniqueDrivers.filter(Boolean),
        purposes: ["All", "Hire", "Repair", "Personal", "Fuel", "Office Use"],
        statuses: ["All", "Approved", "Pending"]
      }
    });
  } catch (error: any) {
    console.error("Admin sales API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
