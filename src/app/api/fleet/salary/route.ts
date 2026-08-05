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

    const salaryDetails = trips.map((trip: any) => ({
      tripRef: (trip.rawValues && trip.rawValues[12]) || trip.reference,
      date: (trip.rawValues && trip.rawValues[7]) || trip.timestamp,
      salary: trip.commission || 0
    }));

    const baseSalary = salaryDetails.reduce((sum: number, item: any) => sum + item.salary, 0);
    const salaryAdvance = adj ? adj.salaryAdvance || 0 : 0;
    const shorts = adj ? adj.shorts || 0 : 0;
    const inclusions = adj ? adj.inclusions || 0 : 0;
    const comment = adj ? adj.comment || "" : "";
    const totalSalary = baseSalary - salaryAdvance - shorts + inclusions;

    return NextResponse.json({ 
      salaryDetails, 
      baseSalary,
      salaryAdvance, 
      shorts, 
      inclusions,
      comment, 
      totalSalary 
    });
  } catch (error: any) {
    console.error("Error fetching salary details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
