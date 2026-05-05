import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export async function GET() {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID_MASTER,
    range: 'master!B:V',
  });
  
  return NextResponse.json({
    range: response.data.range,
    firstRow: response.data.values?.[0]
  });
}
