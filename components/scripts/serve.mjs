#!/usr/bin/env node
import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv[2] || '.';
const port = Number(process.argv[3] || 5174);
const root = path.resolve(process.cwd(), rootArg);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(root, urlPath);

    // If directory, try index.html
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      stat = null;
    }
    if (stat && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';
    const data = await fs.readFile(filePath);
    send(res, 200, data, { 'Content-Type': contentType });
  } catch (e) {
    if (e.code === 'ENOENT') {
      return send(res, 404, 'Not found');
    }
    console.error(e);
    return send(res, 500, 'Server error');
  }
});

server.listen(port, () => {
  const demoUrl = `http://localhost:${port}/components/demo/`;
  console.log(`Serving ${root} at http://localhost:${port}`);
  console.log(`Open demo: ${demoUrl}`);
});

