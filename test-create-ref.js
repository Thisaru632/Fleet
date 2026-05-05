async function testCreateRef() {
  const res = await fetch('http://localhost:3000/api/fleet/create-ref', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: '2026-05-05 10:00:00', drvId: 'DRV01' })
  });
  const data = await res.json();
  console.log('Create Ref response:', data);
}

testCreateRef().catch(console.error);
