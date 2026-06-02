import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate"); // YYYY-MM-DD
  const endDate = searchParams.get("endDate");     // YYYY-MM-DD
  const purposeFilter = searchParams.get("purpose"); // All, Hire, Repair
  const statusFilter = searchParams.get("status");   // All, Approved, Pending
  const vehicleFilter = searchParams.get("vehicle");
  const driverFilter = searchParams.get("driver");

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

    const trips = await Trip.find(query).sort({ timestamp: -1 });

    // KPI Calculations
    let totalSales = 0;
    let totalCommission = 0;
    let totalFuel = 0;
    let totalRepairCost = 0;
    let totalMileage = 0;
    let hireCount = 0;
    let repairCount = 0;

    trips.forEach((trip: any) => {
      totalSales += trip.finalPrice || 0;
      totalCommission += trip.commission || 0;
      totalFuel += trip.fuel || 0;
      totalRepairCost += trip.repair || 0;
      
      if (trip.purpose === "Hire") {
        totalMileage += trip.mileage || 0;
        hireCount++;
      }
      if (trip.purpose === "Repair") repairCount++;
    });

    const netIncome = totalSales - totalCommission - totalFuel - totalRepairCost;

    // Chart Data Preparation
    const dailyDataMap: any = {};
    const vehicleDataMap: any = {};
    const driverDataMap: any = {};
    const purposeDataMap: any = { Hire: 0, Repair: 0, Other: 0 };
    const monthlyDataMap: any = {};

    trips.forEach((trip: any) => {
      const date = trip.timestamp ? trip.timestamp.split(" ")[0] : "Unknown";
      const month = date !== "Unknown" ? date.substring(0, 7) : "Unknown"; // YYYY-MM
      const vehicle = trip.vehicle || "Unknown";
      const driver = trip.driverId || "Unknown";
      const purpose = trip.purpose;
      const sales = trip.finalPrice || 0;

      if (date !== "Unknown") dailyDataMap[date] = (dailyDataMap[date] || 0) + sales;
      vehicleDataMap[vehicle] = (vehicleDataMap[vehicle] || 0) + sales;
      driverDataMap[driver] = (driverDataMap[driver] || 0) + sales;
      if (month !== "Unknown") monthlyDataMap[month] = (monthlyDataMap[month] || 0) + sales;

      if (purpose === "Hire") purposeDataMap.Hire++;
      else if (purpose === "Repair") purposeDataMap.Repair++;
      else purposeDataMap.Other++;
    });

    const dailySales = Object.keys(dailyDataMap).sort().map(date => ({ date, sales: dailyDataMap[date] }));
    const vehicleSales = Object.keys(vehicleDataMap).map(vehicle => ({ vehicle, sales: vehicleDataMap[vehicle] }))
      .sort((a, b) => b.sales - a.sales);
    const driverSales = Object.keys(driverDataMap).map(driver => ({ driver, sales: driverDataMap[driver] }))
      .sort((a, b) => b.sales - a.sales);
    const monthlySales = Object.keys(monthlyDataMap).sort().map(month => ({ month, sales: monthlyDataMap[month] }));
    const purposeCount = Object.keys(purposeDataMap).map(purpose => ({ purpose, count: purposeDataMap[purpose] }));

    // Recent Trips (Last 10)
    const recentTrips = trips.slice(-10).reverse().map((trip: any) => ({
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

    // Filter Options
    const allTrips = await Trip.find({}, { vehicle: 1, driverId: 1 });

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const totalItems = trips.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Slice for fleetData (already sorted in memory if needed, but here we use the existing trips array)
    const fleetData = trips.slice(skip, skip + limit).map((trip: any) => ({
      rf: trip.reference,
      date: trip.timestamp,
      driver: trip.driverId,
      vehicle: trip.vehicle,
      purpose: trip.purpose,
      status: trip.status,
      values: trip.rawValues || [],
      images: trip.images || []
    }));

    return NextResponse.json({
      kpis: {
        totalSales,
        totalCommission,
        netIncome,
        hireCount,
        repairCount,
        totalMileage,
        totalFuel,
        totalRepairCost
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
        fleetData
      },
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      },
      filterOptions: {
        vehicles: Array.from(new Set(allTrips.map((t: any) => t.vehicle))).filter(Boolean),
        drivers: Array.from(new Set(allTrips.map((t: any) => t.driverId))).filter(Boolean),
        purposes: ["All", "Hire", "Repair", "Personal", "Fuel"],
        statuses: ["All", "Approved", "Pending"]
      }
    });
  } catch (error: any) {
    console.error("Admin sales API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
