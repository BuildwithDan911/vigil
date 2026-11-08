/**
 * Capture Real App Screenshots directly from the running Vigil UI
 * Uses native Node.js WebSocket and Chrome DevTools Protocol (CDP)
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8000/';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

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
  console.log('==> Launching Chrome for real screen capture...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1440,900',
    '--user-data-dir=' + path.join(process.env.TEMP, 'chrome_cdp_profile')
  ]);

  await sleep(2000);

  try {
    const version = await fetchJson('http://127.0.0.1:9222/json/version');
    console.log('Connected to Chrome CDP:', version.Browser);

    const newTab = await fetchJson('http://127.0.0.1:9222/json/new?' + encodeURIComponent(TARGET_URL), 'PUT');
    console.log('Opened Tab:', newTab.webSocketDebuggerUrl);

    const ws = new WebSocket(newTab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    // Enable Page and Runtime
    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // Retina 2x high-res
      mobile: false
    });

    console.log('Waiting for Vigil board to load...');
    await sleep(2500);

    // 1. Board Screenshot
    console.log('Capturing real board-1440.png...');
    let snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'board-1440.png'), Buffer.from(snap.data, 'base64'));

    // 2. Open Patient Detail Modal with Arabic RTL
    console.log('Opening Patient Detail Modal with Arabic script...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        openCardDetail('VGL-01-REEVE');
        document.getElementById('scriptLangSelect').value = 'ar';
        updateScriptLanguage();
      `
    });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'detail-1440.png'), Buffer.from(snap.data, 'base64'));

    // Close detail modal
    await sendCdp(ws, 'Runtime.evaluate', { expression: `closeDetailModal();` });
    await sleep(300);

    // 3. Switch to 24h Night Shift Replay
    console.log('Capturing real nightshift-split-1440.png...');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('nightshift');` });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'nightshift-split-1440.png'), Buffer.from(snap.data, 'base64'));

    // 4. Switch to Safety Audit Log (Ledger)
    console.log('Capturing real report-1440.png (Cryptographic Ledger)...');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('ledger'); verifyLedger();` });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'report-1440.png'), Buffer.from(snap.data, 'base64'));

    // Mobile Captures (375px width)
    console.log('Capturing mobile 375px screens...');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('board');` });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'board-375.png'), Buffer.from(snap.data, 'base64'));

    await sendCdp(ws, 'Runtime.evaluate', { expression: `openCardDetail('VGL-01-REEVE');` });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'detail-375.png'), Buffer.from(snap.data, 'base64'));
    await sendCdp(ws, 'Runtime.evaluate', { expression: `closeDetailModal();` });

    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('nightshift');` });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'nightshift-split-375.png'), Buffer.from(snap.data, 'base64'));

    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('ledger');` });
    await sleep(600);
    snap = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'report-375.png'), Buffer.from(snap.data, 'base64'));

    ws.close();
    console.log('==> ALL 4 REAL APP SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
