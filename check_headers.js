const { getSheets } = require('./src/lib/google');

async function run() {
  try {
    const sheets = await getSheets();
    const spreadsheetId = process.env.SPREADSHEET_ID_MASTER;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'master!A1:Z1'
    });
    console.log('HEADERS:', res.data.values[0]);
  } catch (e) {
    console.error(e);
  }
}

run();
