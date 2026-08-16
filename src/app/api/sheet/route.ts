import { NextResponse } from "next/server";
import { getSheets } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get("sheet") || "Sheet1";
  const rangeParam = searchParams.get("range") || "A1:Z100";

  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "SPREADSHEET_ID is not configured" }, { status: 400 });
    }

    const sheets = await getSheets();
    const range = `${sheetName}!${rangeParam}`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error in GET /api/sheet:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sheet data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sheetName = "Sheet1", values = [] } = body;

    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "SPREADSHEET_ID is not configured" }, { status: 400 });
    }

    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true, updatedCells: response.data.updates?.updatedCells });
  } catch (error: any) {
    console.error("Error in POST /api/sheet:", error);
    return NextResponse.json({ error: error.message || "Failed to write sheet data" }, { status: 500 });
  }
}
