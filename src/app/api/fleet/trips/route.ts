import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get('drvId');

  if (!drvId) {
    return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
  }

  try {
    const sheets = await getSheets();
    
    // Fetch both in parallel to save time
    const [accountsResponse, masterResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: '1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs',
        range: 'master!A2:N',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID_MASTER,
        range: 'master!B3:M',
      })
    ]);

    const accountRows = accountsResponse.data.values || [];
    const masterRows = masterResponse.data.values || [];
    
    // Get today's date in YYYY-MM-DD format (local time)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const tripRefs = accountRows
      .filter((row: any[]) => 
        row[11] && 
        row[9] === 'DV1811' && 
        !row[0] && 
        row[5] === 'Assigned' && 
        row[13] === today
      )
      .map((row: any[]) => ({
        ref: row[11],
        vehicle: row[7]
      }));

    // Trip refs already in master
    const usedTripRefs = new Set(masterRows.map((row: any[]) => row[11]?.toString().trim()).filter(Boolean));

    const frRefs = masterRows
      .filter((row: any[]) => row[0] && row[2] === drvId && !row[7])
      .map((row: any[]) => row[0]);

    // Filter tripRefs from Accounts that are already in Master
    const filteredTripRefs = tripRefs.filter((item: any) => !usedTripRefs.has(item.ref.toString().trim()));

    return NextResponse.json({ tripRefs: filteredTripRefs, frRefs });
  } catch (error: any) {
    console.error('Error fetching trips/refs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
