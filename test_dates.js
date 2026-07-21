const http = require('http');

async function test() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // The server is running locally on port 3000
    const [accDataRes, fleetRes] = await Promise.all([
      fetch('http://localhost:3000/api/admin/account-data?page=1&limit=5000'),
      fetch('http://localhost:3000/api/admin/sales?page=1&limit=5000')
    ]);

    const accData = await accDataRes.json();
    const fleetData = await fleetRes.json();
    
    console.log("Account Data rows:", accData.data?.length);
    console.log("Fleet Data rows:", fleetData.tables?.fleetData?.length);

    let count = 0;
    const parseDateStr = (dateStr) => {
      if (!dateStr) return 0;
      const raw = String(dateStr).split(' ')[0].trim();
      if (!raw) return 0;
      let d = new Date(raw);
      if (!isNaN(d.getTime())) return d.getTime();
      const sep = raw.includes('/') ? '/' : (raw.includes('-') ? '-' : null);
      if (sep) {
        const parts = raw.split(sep);
        if (parts.length === 3) {
          d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (!isNaN(d.getTime())) return d.getTime();
        }
      }
      d = new Date(raw.replace(/-/g, '/'));
      if (!isNaN(d.getTime())) return d.getTime();
      return 0;
    };

    const records = fleetData.tables.fleetData.filter(t => t.values[5] === 'Hire' && !String(t.values[0] || '').toLowerCase().includes('cancel'));
    
    console.log("Valid hire records:", records.length);
    
    for (const t of records) {
      const tripRef = t.values[12] || '';
      if (tripRef && accData.data) {
        const accMatch = accData.data.find(row => row.rawValues && row.rawValues[11] === tripRef);
        if (accMatch) {
          const rawEndDate = accMatch.rawValues[15] || '';
          const recordMs = parseDateStr(rawEndDate);
          if (count < 20) {
            console.log(`TripRef: ${tripRef} | RawDate: ${rawEndDate} | Parsed: ${recordMs > 0 ? new Date(recordMs).toISOString() : '0'}`);
            count++;
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

test();
