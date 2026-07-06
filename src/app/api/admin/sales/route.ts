import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import User from "@/models/User";

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
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate + " 23:59:59";
    }
    if (purposeFilter && purposeFilter !== "All") query.purpose = purposeFilter;
    if (statusFilter && statusFilter !== "All") query.status = statusFilter;
    if (vehicleFilter && vehicleFilter !== "All") query.vehicle = vehicleFilter;
    if (driverFilter && driverFilter !== "All") query.driverId = driverFilter;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { reference: searchRegex },
        { vehicle: searchRegex },
        { driverId: searchRegex },
        { status: searchRegex },
        { purpose: searchRegex },
        { rawValues: searchRegex }
      ];

      const searchNum = Number(search);
      if (!isNaN(searchNum)) {
        query.$or.push({ rawValues: searchNum });
      }
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
      users
    ] = await Promise.all([
      Trip.countDocuments(query),
      Trip.find(query, { images: 0 }).sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      Trip.find(query, { images: 0, rawValues: 0 }).sort({ _id: -1 }).limit(10).lean(),
      Trip.aggregate([
        { $match: query },
        { $group: {
            _id: null,
            totalSales: { $sum: "$finalPrice" },
            totalCommission: { $sum: "$commission" },
            totalFuel: { $sum: "$fuel" },
            totalRepairCost: { $sum: "$repair" },
            totalMileage: { $sum: { $cond: [{ $eq: ["$purpose", "Hire"] }, "$mileage", 0] } },
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
                  _id: { $substrBytes: [{ $ifNull: ["$timestamp", "Unknown   "] }, 0, 10] },
                  sales: { $sum: "$finalPrice" }
                }
              },
              { $sort: { _id: 1 } }
            ],
            byVehicle: [
              {
                $group: {
                  _id: { $ifNull: ["$vehicle", "Unknown"] },
                  sales: { $sum: "$finalPrice" }
                }
              },
              { $sort: { sales: -1 } }
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
                  _id: { $substrBytes: [{ $ifNull: ["$timestamp", "Unknown   "] }, 0, 7] },
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
      User.find({}, { username: 1, name: 1, password: 1, phone: 1, role: 1, status: 1 }).lean()
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
    const netIncome = (kpis.totalSales || 0) - (kpis.totalCommission || 0) - (kpis.totalFuel || 0) - (kpis.totalRepairCost || 0);

    // Charts mapping
    const chartsData = chartsAggregation[0];
    const dailySales = chartsData.byDate.map((d: any) => ({ date: d._id, sales: d.sales }));
    const vehicleSales = chartsData.byVehicle.map((d: any) => ({ vehicle: d._id, sales: d.sales }));
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
      date: trip.timestamp,
      driver: trip.driverId,
      vehicle: trip.vehicle,
      purpose: trip.purpose,
      status: trip.status,
      values: trip.rawValues || [],
    }));

    // Format Recent Trips
    const recentTrips = recentTripsRaw.map((trip: any) => ({
      rf: trip.reference,
      date: trip.timestamp,
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
        totalRepairCost: kpis.totalRepairCost || 0
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
        driversList
      },
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      },
      driverNames,
      filterOptions: {
        vehicles: uniqueVehicles.filter(Boolean),
        drivers: uniqueDrivers.filter(Boolean),
        purposes: ["All", "Hire", "Repair", "Personal", "Fuel"],
        statuses: ["All", "Approved", "Pending"]
      }
    });
  } catch (error: any) {
    console.error("Admin sales API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
