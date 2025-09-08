// Keep-alive script to prevent Render.com cold starts
// Run this script every 10 minutes to keep your app warm

const https = require('https');
const http = require('http');

const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || 'https://booby-blendz-backend.onrender.com/api/keepalive';
const INTERVAL = 10 * 60 * 1000; // 10 minutes

function pingServer() {
  const url = new URL(KEEP_ALIVE_URL);
  const client = url.protocol === 'https:' ? https : http;
  
  const req = client.request(url, { method: 'GET' }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] Keep-alive ping successful:`, JSON.parse(data));
    });
  });
  
  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Keep-alive ping failed:`, error.message);
  });
  
  req.setTimeout(10000, () => {
    console.error(`[${new Date().toISOString()}] Keep-alive ping timeout`);
    req.destroy();
  });
  
  req.end();
}

// Start keep-alive pings
console.log(`Starting keep-alive pings to ${KEEP_ALIVE_URL} every ${INTERVAL / 1000 / 60} minutes`);
pingServer(); // Initial ping
setInterval(pingServer, INTERVAL);
