import { NextResponse } from 'next/server';
import { getSheets, getDrive } from '@/lib/google';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { timestamp, drvId } = await request.json();
    const sheets = await getSheets();
    const drive = await getDrive();

    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;
    const range = 'master!B:B';
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    const references = values.flat().filter(ref => typeof ref === 'string' && ref.startsWith('FR'));
    
    const lastReference = references
      .sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)))
      .pop();

    const nextNumber = lastReference ? parseInt(lastReference.slice(2)) + 1 : 1;
    const newReference = `FR${String(nextNumber).padStart(5, '0')}`;

    // Create Drive Folder
    let folderId, folderUrl;

    if (process.env.APPS_SCRIPT_WEB_APP_URL) {
      const proxyRes = await fetch(process.env.APPS_SCRIPT_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'createFolder',
          parentId: process.env.DRIVE_PARENT_FOLDER_ID,
          folderName: `${newReference} ${drvId}`
        })
      });
      
      const proxyData = await proxyRes.json();
      if (!proxyData.success) {
        throw new Error('Apps Script Proxy Error: ' + proxyData.error);
      }
      folderId = proxyData.folderId;
      folderUrl = proxyData.folderUrl;
    } else {
      const folderMetadata = {
        name: `${newReference} ${drvId}`,
        parents: [process.env.DRIVE_PARENT_FOLDER_ID!],
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      folderId = folder.data.id;
      folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    }

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'master!A:V',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ["Pending", newReference, timestamp, drvId, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', folderUrl, folderId]
        ],
      },
    });

    return NextResponse.json({ reference: newReference, folderId });
  } catch (error: any) {
    console.error('CRITICAL ERROR in create-ref:', {
      message: error.message,
      code: error.code,
      details: error.response?.data?.error
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
