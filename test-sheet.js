const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function test() {
  try {
    const credsPath = path.join(__dirname, 'src/lib/service-account.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: credsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = '1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs';
    
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("Tabs:", meta.data.sheets.map(s => s.properties.title));
    
    // Read the first tab
    const tabName = meta.data.sheets[0].properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:N10`,
    });
    
    console.log(`Headers for ${tabName}:`);
    console.table(res.data.values);
  } catch(e) {
    console.error(e);
  }
}
test();
