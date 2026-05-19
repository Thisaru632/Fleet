import { NextResponse } from "next/server";
import { getSheets } from "@/lib/google";
import dbConnect from "@/lib/mongodb";
import AccountSheet from "@/models/AccountSheet";
import SheetMetadata from "@/models/SheetMetadata";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const sheets = await getSheets();
    const spreadsheetId = "1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs";
    
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const availableSheets = meta.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    let sheetName = availableSheets.find((s: any) => s === "Master") || 
                    availableSheets.find((s: any) => s?.toLowerCase() === "account") || 
                    availableSheets.find((s: any) => s?.toLowerCase().includes("account")) || 
                    availableSheets[0];

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:BP`,
    });
    
    const allRows = response.data.values || [];
    if (allRows.length < 2) {
      return NextResponse.json({ 
        error: "Sheet is empty or has no data.",
        details: { sheetName, availableSheets } 
      });
    }

    const headers = allRows[0];
    const rows = allRows.slice(1);

    // Save headers to metadata
    await SheetMetadata.findOneAndUpdate(
      { key: "account_sheet_headers" },
      { value: headers },
      { upsert: true }
    );

    let dateIdx = headers.findIndex((h: any) => h?.toLowerCase().includes("date"));
    if (dateIdx === -1) dateIdx = 13; 

    const startDate = new Date("2026-01-01");
    const docs = [];

    for (const row of rows) {
      const dateStr = row[dateIdx];
      if (!dateStr) continue;
      
      const rowDate = new Date(dateStr);
      if (!isNaN(rowDate.getTime()) && rowDate >= startDate) {
        docs.push({
          date: rowDate,
          bookingRef: row[11] || "N/A",
          driverId: row[9] || "N/A",
          vehicle: row[7] || "N/A",
          status: row[5] || "N/A",
          rawValues: row,
        });
      }
    }

    if (docs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No rows matched the criteria (Date >= 2026-01-01).",
        details: {
          sheetUsed: sheetName,
          availableSheets,
          headers,
          dateColumnUsed: headers[dateIdx]
        }
      });
    }

    await AccountSheet.deleteMany({});
    await AccountSheet.insertMany(docs);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${docs.length} rows to 'account_sheet' collection.`,
      details: {
        sheetUsed: sheetName,
        dateColumn: headers[dateIdx],
        rowCount: docs.length
      }
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
