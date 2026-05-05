const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const jsonPath = path.join(__dirname, 'src/lib/service-account.json');
    console.log('Checking for JSON file at:', jsonPath);
    
    let auth;
    if (fs.existsSync(jsonPath)) {
      console.log('SUCCESS: service-account.json found. Using it for auth...');
      auth = new google.auth.GoogleAuth({
        keyFile: jsonPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      console.log('JSON file not found. Falling back to environment variables...');
      let privateKey = process.env.GOOGLE_PRIVATE_KEY_B64 
        ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
        : process.env.GOOGLE_PRIVATE_KEY;
        
      const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim();
      
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: formattedKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID_DRIVER || '1Mz2EU50AfNQIDJFEfRT4VHQY0A-r4m6OwXs27reQ_rQ',
      range: 'Fleet Users!A1:A1',
    });

    console.log('FINAL SUCCESS! Connected to sheet:', res.statusText);
  } catch (err) {
    console.error('FAILURE:', err.message);
  }
}

test();
