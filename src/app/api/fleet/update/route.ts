import { NextResponse } from 'next/server';
import { getSheets, getDrive } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { stage, ref, array, files } = await request.json();
    const sheets = await getSheets();
    const drive = await getDrive();
    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;

    // Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'master!B:V',
    });

    if (!ref) {
      console.error('FAILED: No Reference provided in request.');
      return NextResponse.json({ error: 'No Reference provided' }, { status: 400 });
    }

    const rows = response.data.values || [];
    console.log(`Searching for Reference: "${ref}" in ${rows.length} rows`);
    
    // row[0] is column B because the range starts at B
    // We use .trim() to be safe against hidden spaces
    const rowIndex = rows.findIndex((row: any[]) => row[0]?.toString().trim() === ref.trim());

    if (rowIndex === -1) {
      console.error(`FAILED: Reference "${ref}" not found in spreadsheet.`);
      // Log the first few references in the sheet to see what they look like
      console.log('First 5 refs in sheet:', rows.slice(0, 5).map((r: any[]) => r[0]));
      console.log('Last 5 refs in sheet:', rows.slice(-5).map((r: any[]) => r[0]));
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
    }

    const actualRow = rowIndex + 1; 
    const folderId = rows[rowIndex][20]; // Column V is index 20 in range B:V

    // Update values
    // updateRange = ss.getRange(rowIndex, 4, 1, array.length) -> Column D is index 4.
    // In our range B:V, B is 1, C is 2, D is 3.
    // So update range is D: ...
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `master!D${actualRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [array],
      },
    });

    // Handle file uploads
    if (files && files.length > 0) {
      for (const file of files) {
        const base64Data = file.dataUrl.split(',')[1];
        
        if (process.env.APPS_SCRIPT_WEB_APP_URL) {
          const proxyRes = await fetch(process.env.APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
              action: 'uploadFile',
              folderId: folderId,
              fileName: file.name,
              base64Data: base64Data,
              mimeType: 'image/jpeg'
            })
          });
          
          const proxyData = await proxyRes.json();
          if (!proxyData.success) {
            throw new Error('Apps Script Proxy Error: ' + proxyData.error);
          }
        } else {
          const buffer = Buffer.from(base64Data, 'base64');
          const stream = Readable.from(buffer);

          await drive.files.create({
            requestBody: {
              name: file.name,
              parents: [folderId],
            },
            media: {
              mimeType: 'image/jpeg',
              body: stream,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
