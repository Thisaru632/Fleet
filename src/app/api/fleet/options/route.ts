import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sheets = await getSheets();
    
    const cityNamesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID_MASTER,
      range: 'master!E3:F',
    });

    const values = cityNamesResponse.data.values || [];
    // Column E is index 0 (Vehicle Num), Column F is index 1 (Purpose)
    const vehicles = [...new Set(values.map((row: any[]) => row[0]).filter((v: any) => v))];
    const purposes = [...new Set(values.map((row: any[]) => row[1]).filter((p: any) => p))];

    return NextResponse.json({ vehicles, purposes });
  } catch (error: any) {
    console.error('Error fetching options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
