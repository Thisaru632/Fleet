import { NextResponse } from 'next/server';
import { getSheets } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { drvId, drvName, drvPhone, message } = await request.json();
    const sheets = await getSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;

    if (!message || !drvId) {
      return NextResponse.json({ error: 'Message and Driver ID are required' }, { status: 400 });
    }

    const now = new Date();
    const timestamp = now.toLocaleString('sv-SE').replace('T', ' ');

    // Ensure the sheet has the correct headers if it's already there but missing the phone column
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'message!A1:E1',
      });
      const headers = headerRes.data.values?.[0] || [];
      
      // If Column D is "Message", we need to shift it and add "Phone Number"
      if (headers[3] === 'Message' && headers.length === 4) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'message!A1:E1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Timestamp', 'Driver ID', 'Driver Name', 'Phone Number', 'Message']],
          },
        });
      }
    } catch (e) {
      // If range fails, it will be handled by the create logic below
    }

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'message!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[timestamp, drvId, drvName, drvPhone, message]],
        },
      });
    } catch (appendError: any) {
      if (appendError.message.includes('Unable to parse range')) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: 'message' } } }],
          },
        });

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'message!A1:E1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Timestamp', 'Driver ID', 'Driver Name', 'Phone Number', 'Message']],
          },
        });

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'message!A:E',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[timestamp, drvId, drvName, drvPhone, message]],
          },
        });
      } else {
        throw appendError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Message submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
