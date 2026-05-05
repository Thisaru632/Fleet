import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'trip' or 'fr'
  const ref = searchParams.get('ref');

  if (!ref || !type) {
    return NextResponse.json({ error: 'Ref and Type are required' }, { status: 400 });
  }

  try {
    const sheets = await getSheets();

    if (type === 'trip') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID_MASTER,
        range: 'master!L2:BP',
      });
      const rows = response.data.values || [];
      const details = rows.find(row => row[0] === ref);
      return NextResponse.json({ details });
    } else {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID_MASTER,
        range: 'master!B3:M',
      });
      const rows = response.data.values || [];
      const details = rows.find(row => row[0] === ref);
      return NextResponse.json({ details });
    }
  } catch (error: any) {
    console.error('Error fetching details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
