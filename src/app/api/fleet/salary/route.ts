import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const drvId = searchParams.get('drvId');
  const year = searchParams.get('year');   // YYYY
  const month = searchParams.get('month'); // MM (1-12)

  if (!drvId || !year || !month) {
    return NextResponse.json({ error: 'Driver ID, Year, and Month are required' }, { status: 400 });
  }

  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'master!B3:O', 
    });

    const rows = response.data.values || [];
    
    const y = parseInt(year);
    const m = parseInt(month);

    // Calculate date range for the full month
    const startDateStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    const endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    // Filter by drvId, date range, and purpose === 'Hire'
    const filteredRows = rows.filter((row: any[]) => {
      const rowDrvId = row[2]?.toString().trim();
      const rowDateStr = row[1]?.toString().trim(); // Column C: Start TS
      const rowPurpose = row[4]?.toString().trim(); // Column F: Purpose
      
      if (rowDrvId !== drvId) return false;
      if (rowPurpose !== 'Hire') return false;
      if (!rowDateStr) return false;

      // Parse row date (expected format: YYYY-MM-DD ...)
      const rowDate = rowDateStr.split(' ')[0];
      
      return rowDate >= startDateStr && rowDate <= endDateStr;
    });

    const salaryDetails = filteredRows.map((row: any[]) => ({
      tripRef: row[11],   // Column M: Trip Reference
      date: row[1],       // Column C: Start TS
      salary: Number(row[13]?.toString().replace(/[^\d.]/g, '')) || 0 // Column O: Drv Comms
    }));

    const totalSalary = salaryDetails.reduce((sum: number, item: any) => sum + item.salary, 0);

    return NextResponse.json({ salaryDetails, totalSalary });
  } catch (error: any) {
    console.error('Error fetching salary details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
