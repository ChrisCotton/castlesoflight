/**
 * HTTPS Wrapper for NerveCenter
 * Proxies HTTPS traffic on port 443 to the Node.js app on port 3001
 * Uses a self-signed certificate for immediate HTTPS support
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const TARGET_HOST = 'localhost';
const TARGET_PORT = 3001;
const HTTPS_PORT = 443;

// Self-signed certificate paths
const CERT_DIR = '/opt/nervecenter/certs';
const CERT_FILE = path.join(CERT_DIR, 'server.crt');
const KEY_FILE = path.join(CERT_DIR, 'server.key');

// Check if certificates exist
if (!fs.existsSync(CERT_FILE) || !fs.existsSync(KEY_FILE)) {
  console.error(`❌ Certificate files not found at ${CERT_DIR}`);
  process.exit(1);
}

// Load certificates
const options = {
  key: fs.readFileSync(KEY_FILE),
  cert: fs.readFileSync(CERT_FILE),
};

// Create HTTPS server that proxies to the target
const httpsServer = https.createServer(options, (req, res) => {
  // Proxy the request to the target application
  const proxyReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        // Preserve the original host for the backend app
        'x-forwarded-for': req.socket.remoteAddress,
        'x-forwarded-proto': 'https',
        'x-forwarded-host': req.headers.host,
      },
    },
    (proxyRes) => {
      // Forward the status code and headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      // Pipe the response back to the client
      proxyRes.pipe(res);
    }
  );

  // Handle errors
  proxyReq.on('error', (err) => {
    console.error(`Proxy error: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Could not reach the application server');
  });

  // Pipe the request body to the proxy
  req.pipe(proxyReq);
});

// Start the HTTPS server
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`🔒 HTTPS Wrapper listening on port ${HTTPS_PORT}`);
  console.log(`📡 Proxying to ${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`✅ Ready to serve secure traffic`);
});

// Handle errors
httpsServer.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`❌ Permission denied: Cannot bind to port ${HTTPS_PORT}`);
    console.error('   Run with sudo or use a port > 1024');
  } else {
    console.error(`❌ Server error: ${err.message}`);
  }
  process.exit(1);
});
