const fs = require('fs');
const http = require('http');
const cookieFile = process.argv[2];
const cookieHeader = fs.readFileSync(cookieFile, 'utf8')
  .split('\n')
  .filter(Boolean)
  .filter(l => !l.startsWith('#'))
  .map(l => l.split('\t'))
  .filter(f => f.length >= 7)
  .map(f => `${f[5]}=${f[6]}`)
  .join('; ');
const opts = { hostname: 'localhost', port: 3000, path: '/api/user/me', headers: { Cookie: cookieHeader } };
http.get(opts, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      process.stdout.write(j.user.id);
    } catch (e) { process.exit(1); }
  });
}).on('error', () => process.exit(1));
