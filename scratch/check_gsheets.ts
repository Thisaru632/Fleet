const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { getSheets } = require("../src/lib/google");

async function main() {
  const refs = ["20260880992", "20260880985", "FR07720", "FR07723"];
  const sheets = await getSheets();
  
  const fleetSpreadsheetId = process.env.SPREADSHEET_ID;
  const accountSpreadsheetId = "1lf0H2P34w03bapp31h2iOC4ypucKpS94qzlwqVtAkCs";

  console.log("Checking Fleet Spreadsheet ID:", fleetSpreadsheetId);
  if (fleetSpreadsheetId) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: fleetSpreadsheetId,
        range: "A1:ZZ5000"
      });
      const rows = res.data.values || [];
      console.log(`Fleet sheet has ${rows.length} rows.`);
      rows.forEach((r: any, idx: number) => {
        const rowStr = JSON.stringify(r);
        if (refs.some(ref => rowStr.includes(ref))) {
          console.log(`Match in Fleet Sheet at row ${idx + 1}:`, r);
        }
      });
    } catch (e: any) {
      console.log("Fleet Sheet Error:", e.message);
    }
  }

  console.log("\nChecking Account Spreadsheet ID:", accountSpreadsheetId);
  if (accountSpreadsheetId) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: accountSpreadsheetId,
        range: "A1:ZZ5000"
      });
      const rows = res.data.values || [];
      console.log(`Account sheet has ${rows.length} rows.`);
      rows.forEach((r: any, idx: number) => {
        const rowStr = JSON.stringify(r);
        if (refs.some(ref => rowStr.includes(ref))) {
          console.log(`Match in Account Sheet at row ${idx + 1}:`, r[11], r[5], r[7], r[9], r[13]);
        }
      });
    } catch (e: any) {
      console.log("Account Sheet Error:", e.message);
    }
  }

  process.exit(0);
}

main().catch((err: any) => {
  console.error(err);
  process.exit(1);
});

export {};
