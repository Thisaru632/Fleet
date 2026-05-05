async function test() {
  const res = await fetch('http://localhost:3000/api/fleet/trips?drvId=DV1811');
  const data = await res.json();
  console.log(data);
}
test();
