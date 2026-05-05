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
    
    // getTripRefs
    const accountsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: '1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs',
      range: 'master!A2:L',
    });

    const accountRows = accountsResponse.data.values || [];
    const tripRefs = accountRows
      .filter(row => row[11] && row[9] === 'DV1811' && !row[0] && row[5] === 'Assigned')
      .map(row => row[11]);

    // getFrRefs
    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID_MASTER,
      range: 'master!B3:J',
    });

    const masterRows = masterResponse.data.values || [];
    const frRefs = masterRows
      .filter(row => row[0] && row[2] === drvId && !row[7])
      .map(row => row[0]);

    return NextResponse.json({ tripRefs, frRefs });
  } catch (error: any) {
    console.error('Error fetching trips/refs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
