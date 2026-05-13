(async function() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/professionals/professional');
    const data = await res.json();
    console.log('/api/professionals/professional', res.status, data && data.name);
  } catch (error) {
    console.error('/api/professionals/professional error', error.message);
  }

  try {
    const res2 = await fetch('http://127.0.0.1:3000/api/professionals');
    const data2 = await res2.json();
    console.log('/api/professionals', res2.status, Array.isArray(data2) ? data2.length : typeof data2);
  } catch (error) {
    console.error('/api/professionals error', error.message);
  }
})();
