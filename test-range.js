async function testRange() {
  const res = await fetch('http://localhost:3000/api/fleet/test-range');
  const data = await res.json();
  console.log('Range Data:', data);
}

testRange().catch(console.error);
