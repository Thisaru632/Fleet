async function test() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('http://localhost:3000/api/admin/account-data?page=1&limit=1');
  const data = await res.json();
  console.log(data.headers.map((h, i) => i + ': ' + h).join('\n'));
}
test();
