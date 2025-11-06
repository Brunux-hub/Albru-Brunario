const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'dist');
const port = process.env.PORT || 5175;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(root, urlPath);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('404');
        return;
      }
      const ext = path.extname(filePath);
      const ctype = mime[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', ctype);
      res.end(data);
    });
  } catch (e) {
    res.statusCode = 500;
    res.end('500');
  }
});

server.listen(port, () => {
  console.log(`serving dist on port ${port}`);
});
