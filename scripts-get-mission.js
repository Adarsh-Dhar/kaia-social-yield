const http = require('http');
http.get('http://localhost:3000/api/missions', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      const id = j.missions?.[0]?.id || '';
      process.stdout.write(id);
    } catch (e) { process.exit(1); }
  });
}).on('error', () => process.exit(1));
