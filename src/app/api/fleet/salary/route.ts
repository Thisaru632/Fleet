import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get('drvId');
  const startDate = searchParams.get('startDate'); // YYYY-MM-DD
  const endDate = searchParams.get('endDate');     // YYYY-MM-DD

  if (!drvId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Driver ID, Start Date, and End Date are required' }, { status: 400 });
  }

  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'master!B3:O', // Fetch up to Column O (Drv Comms)
    });

    const rows = response.data.values || [];
    
    // Filter by drvId and date range
    const filteredRows = rows.filter((row: any[]) => {
      const rowDrvId = row[2]?.toString().trim();
      const rowDateStr = row[1]?.toString().trim(); // Column C: Start TS
      
      if (rowDrvId !== drvId) return false;
      if (!rowDateStr) return false;

      // Parse row date (expected format: YYYY-MM-DD ...)
      const rowDate = rowDateStr.split(' ')[0];
      
      return rowDate >= startDate && rowDate <= endDate;
    });

    const salaryDetails = filteredRows.map((row: any[]) => ({
      rf: row[0],        // Column B: FR Ref
      date: row[1],      // Column C: Start TS
      salary: Number(row[13]?.toString().replace(/[^\d.]/g, '')) || 0 // Column O: Drv Comms
    }));

    const totalSalary = salaryDetails.reduce((sum: number, item: any) => sum + item.salary, 0);

    return NextResponse.json({ salaryDetails, totalSalary });
  } catch (error: any) {
    console.error('Error fetching salary details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
