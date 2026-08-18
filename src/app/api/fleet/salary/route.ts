import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";
import DriverAdjustment from "@/models/DriverAdjustment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get("drvId");
  const year = searchParams.get("year");   // YYYY
  const month = searchParams.get("month"); // MM (1-12)

  if (!drvId || !year || !month) {
    return NextResponse.json({ error: "Driver ID, Year, and Month are required" }, { status: 400 });
  }

  try {
    await dbConnect();
    
    const y = parseInt(year);
    const m = parseInt(month);

    // Calculate date range for the full month
    const startDateStr = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    const endDateStr = `${y}-${String(m).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")} 23:59:59`;
    const monthKey = `${y}-${String(m).padStart(2, "0")}`;

    const [trips, adj] = (await Promise.all([
      Trip.find(
        {
          driverId: { $regex: new RegExp(`^${drvId}$`, "i") },
          purpose: { $regex: /^Hire$/i },
          "rawValues.7": { $gte: startDateStr, $lte: endDateStr }
        },
        null,
        { sort: { "rawValues.7": 1 }, allowDiskUse: true }
      ),
      DriverAdjustment.findOne({
        driverCode: { $regex: new RegExp(`^${drvId.trim()}$`, "i") },
        month: monthKey
      })
    ])) as [any[], any];

    const ZERO_SALARY_TRIP_REFS = new Set(['20260879626', '20260879925', 'FR07452', 'FR7452', 'FR7525', 'FR07525']);
    const OVERRIDE_DATES: Record<string, string> = {
      '20260879626': '2026-08-08',
      'FR07452': '2026-08-08',
      'FR7452': '2026-08-08',
      '20260879925': '2026-08-14',
      'FR07525': '2026-08-14',
      'FR7525': '2026-08-14',
    };

    const salaryDetails = trips.map((trip: any) => {
      const tripRef = (trip.rawValues && trip.rawValues[12]) || trip.reference;
      const refStr = String(tripRef || '').trim();
      const mainRefStr = String(trip.reference || '').trim();
      const isZeroSalary = ZERO_SALARY_TRIP_REFS.has(refStr) || ZERO_SALARY_TRIP_REFS.has(mainRefStr);
      
      let dateVal = OVERRIDE_DATES[refStr] || OVERRIDE_DATES[mainRefStr];
      if (!dateVal) {
        dateVal = (trip.rawValues && trip.rawValues[7]) || trip.timestamp;
      }

      return {
        tripRef: tripRef,
        date: dateVal,
        salary: isZeroSalary ? 0 : (trip.commission || 0)
      };
    });

    salaryDetails.sort((a: any, b: any) => {
      const getMs = (dStr: string) => {
        if (!dStr) return 0;
        const raw = String(dStr).split(' ')[0].trim();
        if (raw.includes('-')) {
          const parts = raw.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getTime();
          }
        }
        return new Date(raw).getTime() || 0;
      };
      return getMs(a.date) - getMs(b.date);
    });

    const baseSalary = salaryDetails.reduce((sum: number, item: any) => sum + item.salary, 0);
    const salaryAdvance = adj ? adj.salaryAdvance || 0 : 0;
    const shorts = adj ? adj.shorts || 0 : 0;
    const excess = adj ? adj.excess || 0 : 0;
    const inclusions = adj ? adj.inclusions || 0 : 0;
    const exclusions = adj ? adj.exclusions || 0 : 0;
    const comment = adj ? adj.comment || "" : "";
    const exclusionsComment = adj ? adj.exclusionsComment || "" : "";
    const totalSalary = baseSalary - salaryAdvance - shorts + excess + inclusions - exclusions;

    return NextResponse.json({ 
      salaryDetails, 
      baseSalary,
      salaryAdvance, 
      shorts, 
      excess,
      inclusions,
      exclusions,
      comment, 
      exclusionsComment,
      totalSalary 
    });
  } catch (error: any) {
    console.error("Error fetching salary details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
