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
      range: `Master!A1:N5`,
    });
    
    console.log(`Headers for Master:`);
    console.table(res.data.values);
  } catch(e) {
    console.error(e);
  }
}
test();
