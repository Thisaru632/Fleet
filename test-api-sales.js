const http = require('http');

http.get('http://localhost:3000/api/admin/sales?page=1&limit=50', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Success! Items:', json.tables.fleetData.length);
      console.log('Total Items:', json.pagination.totalItems);
    } catch (e) {
      console.log('Failed to parse:', data.substring(0, 200));
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
