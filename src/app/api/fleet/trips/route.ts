import { NextResponse } from "next/server";
import { getSheets } from "@/lib/google";
import dbConnect from "@/lib/mongodb";
import Trip from "@/models/Trip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get("drvId");

  if (!drvId) {
    return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
  }

  try {
    await dbConnect();
    let filteredTripRefs = [];
    try {
      const sheets = await getSheets();
      const accountsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: "1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs",
        range: "account!A2:N",
      });
      const accountRows = accountsResponse.data.values || [];
      
      const tripRefs = accountRows
        .filter((row: any[]) => 
          row[11] && 
          row[9] === drvId && 
          !row[0] && 
          row[5] === "Assigned"
        )
        .map((row: any[]) => ({
          ref: row[11],
          vehicle: row[7]
        }));

      const allTripsInDb = await Trip.find({}, { reference: 1 });
      const usedTripRefs = new Set(allTripsInDb.map(t => t.reference.trim()));
      filteredTripRefs = tripRefs.filter((item: any) => !usedTripRefs.has(item.ref.toString().trim()));
    } catch (sheetError) {
      console.error("Google Sheets fetch failed, skipping tripRefs:", sheetError);
      // Continue without tripRefs if sheets fail
    }

    const tripsInDb = await Trip.find({ driverId: drvId }).sort({ updatedAt: -1 });

    // Pending trips (FR refs) for this driver from MongoDB
    const frRefs = tripsInDb
      .filter(t => t.status === "Pending" || !t.finalPrice)
      .map(t => t.reference);

    const historyFrRefs = tripsInDb
      .map(t => t.reference)
      .reverse()
      .slice(0, 10);

    return NextResponse.json({ tripRefs: filteredTripRefs, frRefs, historyFrRefs });
  } catch (error: any) {
    console.error("Error fetching trips/refs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
