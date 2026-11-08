/**
 * Render YouTube Thumbnail from docs/thumbnail_template.html
 * Dimensions: 1280 x 720 (Standard YouTube 16:9 HD thumbnail)
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8000/thumbnail_template.html';
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'thumbnail.png');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: method
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function sendCdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 100000);
  return new Promise((resolve, reject) => {
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  console.log('==> Launching Chrome to render 1280x720 thumbnail...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1280,720',
    '--user-data-dir=' + path.join(process.env.TEMP, 'chrome_cdp_thumbnail_profile')
  ]);

  await sleep(2000);

  try {
    const version = await fetchJson('http://127.0.0.1:9222/json/version');
    console.log('Connected to Chrome CDP:', version.Browser);

    const newTab = await fetchJson('http://127.0.0.1:9222/json/new?' + encodeURIComponent(TARGET_URL), 'PUT');
    console.log('Opened tab:', newTab.webSocketDebuggerUrl);

    const ws = new WebSocket(newTab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Waiting for template render...');
    await sleep(2000);

    console.log('Capturing screenshot...');
    const snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(OUTPUT_FILE, Buffer.from(snap.data, 'base64'));

    console.log('==> Thumbnail rendered successfully to: ' + OUTPUT_FILE);
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);

    ws.close();
  } catch (err) {
    console.error('Error rendering thumbnail:', err);
  } finally {
    chrome.kill('SIGKILL');
  }
}

main();
