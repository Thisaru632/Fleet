import { NextResponse } from 'next/server';
import { getSheets } from "@/lib/google";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet') || 'Sheet1';
    const range = searchParams.get('range') || 'A1:Z100';
    const spreadsheetId = searchParams.get('id') || process.env.SPREADSHEET_ID;

    const sheets = await getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId as string,
      range: `${sheetName}!${range}`,
    });

    return NextResponse.json(response.data.values || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sheetName = 'Sheet1', range = 'A1', values, id } = body;
    const spreadsheetId = id || process.env.SPREADSHEET_ID;

    const sheets = await getSheets();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId as string,
      range: `${sheetName}!${range}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: values || [["Sample Name", "Sample Email"]],
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
