const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function checkSheet() {
  const jsonPath = path.join(process.cwd(), 'src/lib/service-account.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: jsonPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1AWPhVc4cMHuUwj6Q3FEvUfj7bUYhwnThOfH8VT7ny8w';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'master!A:B',
    });
    const rows = res.data.values || [];
    console.log('Last 10 rows of master:', rows.slice(-10));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSheet();
