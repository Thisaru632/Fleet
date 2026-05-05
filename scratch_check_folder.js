const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function checkFolder() {
  const jsonPath = path.join(process.cwd(), 'src/lib/service-account.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: jsonPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const folderId = process.env.DRIVE_PARENT_FOLDER_ID;

  console.log('Checking Folder ID:', folderId);

  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, capabilities',
    });
    console.log('SUCCESS! Found Folder:', res.data.name);
    console.log('Capabilities:', res.data.capabilities);
  } catch (err) {
    console.error('FAILURE:', err.message);
    if (err.response) {
      console.error('Details:', err.response.data.error);
    }
  }
}

checkFolder();
