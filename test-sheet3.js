const { google } = require('googleapis');
const path = require('path');

async function test() {
  try {
    const credsPath = path.join(__dirname, 'src/lib/service-account.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: credsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheetId = '1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs';
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Master!A2:L`,
    });
    
    const rows = res.data.values || [];
    const dv1811 = rows.filter(r => r[9] === 'DV1811');
    console.log(`Found ${dv1811.length} rows for DV1811.`);
    console.table(dv1811);
  } catch(e) {
    console.error(e);
  }
}
test();
