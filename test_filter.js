const http = require('http');

async function test() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const [accDataRes, fleetRes] = await Promise.all([
      fetch('http://localhost:3000/api/admin/account-data?page=1&limit=5000'),
      fetch('http://localhost:3000/api/admin/sales?page=1&limit=5000')
    ]);

    const accData = await accDataRes.json();
    const fleetData = await fleetRes.json();
    
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

    const reportStartDate = "2026-07-20";
    const reportEndDate = "2026-07-20";

    const startMs = reportStartDate ? parseDateStr(reportStartDate) : 0;
    const endMs = reportEndDate ? parseDateStr(reportEndDate) + 86399999 : Infinity;

    console.log("startMs:", startMs, new Date(startMs).toISOString());
    console.log("endMs:", endMs, new Date(endMs).toISOString());

    const records = fleetData.tables.fleetData
      .filter((t) => t.values[5] === 'Hire' && !String(t.values[0] || '').toLowerCase().includes('cancel'))
      .filter((t) => {
        if (!startMs && endMs === Infinity) return true;
        const tripRef = t.values[12] || '';
        let recordMs = 0;
        if (tripRef && accData.data) {
          const accMatch = accData.data.find(row => row.rawValues && row.rawValues[11] === tripRef);
          if (accMatch) {
            const rawEndDate = accMatch.rawValues[15] || '';
            recordMs = parseDateStr(rawEndDate);
          }
        }
        if (!recordMs) return false;
        return recordMs >= startMs && recordMs <= endMs;
      });

    console.log(`Filtered records for ${reportStartDate} to ${reportEndDate}:`, records.length);
    
    for(let i=0; i<Math.min(3, records.length); i++) {
        const tripRef = records[i].values[12] || '';
        const accMatch = accData.data.find(row => row.rawValues && row.rawValues[11] === tripRef);
        console.log("Included:", tripRef, "Date:", accMatch.rawValues[15]);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
