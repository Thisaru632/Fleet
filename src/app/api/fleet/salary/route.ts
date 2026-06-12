import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

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

    const trips = await Trip.find(
      {
        driverId: { $regex: new RegExp(`^${drvId}$`, "i") },
        purpose: { $regex: /^Hire$/i },
        timestamp: { $gte: startDateStr, $lte: endDateStr }
      },
      null,
      { sort: { timestamp: 1 }, allowDiskUse: true }
    );

    const salaryDetails = trips.map((trip: any) => ({
      tripRef: (trip.rawValues && trip.rawValues[12]) || trip.reference,
      date: trip.timestamp,
      salary: trip.commission || 0
    }));

    const totalSalary = salaryDetails.reduce((sum: number, item: any) => sum + item.salary, 0);

    return NextResponse.json({ salaryDetails, totalSalary });
  } catch (error: any) {
    console.error("Error fetching salary details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
