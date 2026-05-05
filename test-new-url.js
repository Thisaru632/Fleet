async function testURL() {
  const url = 'https://script.google.com/macros/s/AKfycbwtQg1_EyscuwxnHP12BXD89mKTYN2pIs9ZYx_TT6sWWa8kK8vxc_iyVkStL0vIZ1Ku/exec';
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'test' })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
testURL();
