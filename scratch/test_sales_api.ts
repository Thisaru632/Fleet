import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const res = await fetch("http://localhost:3000/api/admin/sales?page=1&limit=100");
  const data = await res.json();
  const fleetData = data.tables?.fleetData || [];

  console.log("Total records returned in fleetData:", fleetData.length);
  const idx662 = fleetData.findIndex((r: any) => r.rf === 'FR07662');
  const idx663 = fleetData.findIndex((r: any) => r.rf === 'FR07663');

  console.log("FR07662 index:", idx662);
  console.log("FR07663 index:", idx663);
  if (idx662 !== -1 && idx663 !== -1) {
    console.log("FR07663 is right after FR07662:", idx663 === idx662 + 1);
    console.log("FR07663 object:", JSON.stringify(fleetData[idx663], null, 2));
  }
}

main().catch(console.error);
