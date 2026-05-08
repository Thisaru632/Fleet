import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate'); // YYYY-MM-DD
  const endDate = searchParams.get('endDate');     // YYYY-MM-DD
  const purposeFilter = searchParams.get('purpose'); // All, Hire, Repair
  const statusFilter = searchParams.get('status');   // All, Approved, Pending
  const vehicleFilter = searchParams.get('vehicle');
  const driverFilter = searchParams.get('driver');

  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'master!A3:V', 
    });

    const rows = response.data.values || [];
    
    // Filter the rows
    const filteredRows = rows.filter((row: any[]) => {
      const status = row[0];
      const startTs = row[2];
      const driver = row[3];
      const vehicle = row[4];
      const purpose = row[5];
      
      if (!startTs) return false;
      const rowDate = startTs.split(' ')[0];

      if (startDate && rowDate < startDate) return false;
      if (endDate && rowDate > endDate) return false;
      if (purposeFilter && purposeFilter !== 'All' && purpose !== purposeFilter) return false;
      if (statusFilter && statusFilter !== 'All' && status !== statusFilter) return false;
      if (vehicleFilter && vehicleFilter !== 'All' && vehicle !== vehicleFilter) return false;
      if (driverFilter && driverFilter !== 'All' && driver !== driverFilter) return false;

      return true;
    });

    // KPI Calculations
    let totalSales = 0;
    let totalCommission = 0;
    let totalFuel = 0;
    let totalRepairCost = 0;
    let totalMileage = 0;
    let hireCount = 0;
    let repairCount = 0;

    const parseNum = (val: any) => Number(val?.toString().replace(/[^\d.]/g, '')) || 0;

    filteredRows.forEach((row: any[]) => {
      const fuel = parseNum(row[9]);
      const repair = parseNum(row[11]);
      const scDue = parseNum(row[13]);
      const comms = parseNum(row[14]);
      const mileage = parseNum(row[20]);
      const purpose = row[5];

      totalSales += scDue;
      totalCommission += comms;
      totalFuel += fuel;
      totalRepairCost += repair;
      totalMileage += mileage;

      if (purpose === 'Hire') hireCount++;
      if (purpose === 'Repair') repairCount++;
    });

    const netIncome = totalSales - totalCommission - totalFuel - totalRepairCost;

    // Chart Data Preparation
    const dailyDataMap: any = {};
    const vehicleDataMap: any = {};
    const driverDataMap: any = {};
    const purposeDataMap: any = { Hire: 0, Repair: 0, Other: 0 };
    const monthlyDataMap: any = {};

    filteredRows.forEach((row: any[]) => {
      const date = row[2].split(' ')[0];
      const month = date.substring(0, 7); // YYYY-MM
      const vehicle = row[4];
      const driver = row[3];
      const purpose = row[5];
      const sales = parseNum(row[13]);

      dailyDataMap[date] = (dailyDataMap[date] || 0) + sales;
      vehicleDataMap[vehicle] = (vehicleDataMap[vehicle] || 0) + sales;
      driverDataMap[driver] = (driverDataMap[driver] || 0) + sales;
      monthlyDataMap[month] = (monthlyDataMap[month] || 0) + sales;

      if (purpose === 'Hire') purposeDataMap.Hire++;
      else if (purpose === 'Repair') purposeDataMap.Repair++;
      else purposeDataMap.Other++;
    });

    const dailySales = Object.keys(dailyDataMap).sort().map(date => ({ date, sales: dailyDataMap[date] }));
    const vehicleSales = Object.keys(vehicleDataMap).map(vehicle => ({ vehicle, sales: vehicleDataMap[vehicle] }))
      .sort((a, b) => b.sales - a.sales);
    const driverSales = Object.keys(driverDataMap).map(driver => ({ driver, sales: driverDataMap[driver] }))
      .sort((a, b) => b.sales - a.sales);
    const monthlySales = Object.keys(monthlyDataMap).sort().map(month => ({ month, sales: monthlyDataMap[month] }));
    const purposeCount = Object.keys(purposeDataMap).map(purpose => ({ purpose, count: purposeDataMap[purpose] }));

    // Recent Trips (Last 10 from filtered)
    const recentTrips = filteredRows.slice(-10).reverse().map((row: any[]) => ({
      rf: row[1],
      date: row[2],
      driver: row[3],
      vehicle: row[4],
      purpose: row[5],
      status: row[0],
      scDue: parseNum(row[13]),
      comms: parseNum(row[14]),
      fuel: parseNum(row[9]),
      repair: parseNum(row[11]),
      mileage: parseNum(row[20])
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
        recentTrips
      },
      // For filters
      filterOptions: {
        vehicles: Array.from(new Set(rows.map((r: any) => r[4]))).filter(Boolean),
        drivers: Array.from(new Set(rows.map((r: any) => r[3]))).filter(Boolean),
        purposes: ['All', 'Hire', 'Repair', 'Personal', 'Fuel'],
        statuses: ['All', 'Approved', 'Pending']
      }
    });
  } catch (error: any) {
    console.error('Admin sales API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
