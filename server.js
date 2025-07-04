const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DIST_DIR = './dist';

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

function getMimeType(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  return mimeTypes[extname] || 'application/octet-stream';
}

function serveFile(res, filePath, statusCode = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return serve404(res);
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(statusCode, { 'Content-Type': mimeType });
    res.end(data);
  });
}

function serve404(res) {
  const notFoundPath = path.join(DIST_DIR, '200.html');

  fs.readFile(notFoundPath, (err, data) => {
    if (err) {
      console.error('Error reading 200.html:', err);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // Handle root path
  if (pathname === '/') {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fileExists(indexPath)) {
      serveFile(res, indexPath);
    } else {
      serve404(res);
    }
    return;
  }

  // Remove leading slash
  if (pathname.startsWith('/')) {
    pathname = pathname.substring(1);
  }

  // Try to serve the exact file first
  let filePath = path.join(DIST_DIR, pathname);

  if (fileExists(filePath)) {
    serveFile(res, filePath);
    return;
  }

  // If no file extension, try adding .html
  if (!path.extname(pathname)) {
    const htmlPath = path.join(DIST_DIR, `${pathname}.html`);
    if (fileExists(htmlPath)) {
      serveFile(res, htmlPath);
      return;
    }
  }

  // If file doesn't exist, serve 200.html
  serve404(res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving content from: ${path.resolve(DIST_DIR)}`);
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
