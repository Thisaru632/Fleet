const { google } = require('googleapis');
const path = require('path');

async function test() {
  try {
    console.log('Testing connection with service-account.json...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1Mz2EU50AfNQIDJFEfRT4VHQY0A-r4m6OwXs27reQ_rQ', // Driver sheet
      range: 'Fleet Users!A1:A1',
    });

    console.log('SUCCESS! Connected to sheet using JSON file.');
  } catch (err) {
    console.error('FAILURE:', err.message);
  }
}

test();
