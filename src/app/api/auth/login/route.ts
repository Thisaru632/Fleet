import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const sheets = await getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID_DRIVER,
      range: 'Sheet2!A:D',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found in driver database');

    const user = rows.find((row: any[]) => row[0] === username && row[1] === password);

    if (user) {
      return NextResponse.json({ success: true, user });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
