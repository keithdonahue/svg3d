const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 5555;
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let file = req.url === '/' ? '/demo/index.html' : req.url;
  file = path.join(__dirname, file.split('?')[0]);
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(file);
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(port, () => {
  console.log('SVG3D demo: http://localhost:' + port + '/demo/');
});
