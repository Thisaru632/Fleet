fetch('http://localhost:3000/api/fleet/create-record', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timestamp: "2026-07-01 11:00:00",
    drvId: "Driver1",
    array: new Array(24).fill(''),
    files: []
  })
}).then(res => res.text()).then(text => console.log("Response:", text.substring(0, 500))).catch(console.error);
