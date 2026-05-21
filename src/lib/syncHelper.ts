import { getSheets } from "@/lib/google";
import AccountSheet from "@/models/AccountSheet";
import SheetMetadata from "@/models/SheetMetadata";
import dbConnect from "./mongodb";

export async function runAccountSync() {
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
    return {
      success: false,
      message: "Sheet is empty or has no data.",
      details: { sheetName, availableSheets }
    };
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

  let driverIdx = headers.findIndex((h: any) => h?.toLowerCase().trim() === "driver code");
  if (driverIdx === -1) driverIdx = 9;

  // Calculate dynamic start date: 10 days ago from current date
  const today = new Date();
  const startDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
  startDate.setHours(0, 0, 0, 0); // Start of day 10 days ago

  let insertedCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    const dateStr = row[dateIdx];
    if (!dateStr) continue;
    
    const rowDate = new Date(dateStr);
    // Sync if rowDate is valid and rowDate >= startDate (10 days ago or future)
    if (!isNaN(rowDate.getTime()) && rowDate >= startDate) {
      const driverCode = row[driverIdx] ? row[driverIdx].toString().trim().toUpperCase() : "";
      if (driverCode !== "DV1811") continue;

      const bookingRef = (row[11] || "N/A").toString().trim();
      const driverId = row[9] || "N/A";
      const vehicle = row[7] || "N/A";
      const status = row[5] || "N/A";

      // Upsert using bookingRef
      if (bookingRef && bookingRef !== "N/A" && bookingRef !== "") {
        const updateData = {
          date: rowDate,
          driverId,
          vehicle,
          status,
          rawValues: row
        };

        const result = await AccountSheet.updateOne(
          { bookingRef },
          { $set: updateData },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          insertedCount++;
        } else if (result.matchedCount > 0) {
          updatedCount++;
        }
      }
    }
  }

  return {
    success: true,
    message: `Sync completed: Inserted ${insertedCount} new rows, updated ${updatedCount} existing rows.`,
    details: {
      sheetUsed: sheetName,
      dateColumn: headers[dateIdx],
      insertedCount,
      updatedCount
    }
  };
}
