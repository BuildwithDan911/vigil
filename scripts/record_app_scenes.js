/**
 * Record real app screen frames directly from http://localhost:8000/
 * Executes actual clinical actions: Review, Arabic RTL, Accept Ownership,
 * Simulate Emergency, Test Safety Floor, Night Shift Replay, and SHA-256 Ledger.
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8000/';
const ASSETS_DIR = path.join(__dirname, '..', 'docs', 'video_assets');
os = require('os');

function sleep(ms) {
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

async function captureFrame(ws, filename) {
  const snap = await sendCdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });
  const outPath = path.join(ASSETS_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
  console.log(`    Captured real frame: ${filename}`);
}

async function main() {
  console.log('==> Starting Chrome for live Vigil interaction recording...');
  const profileDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_record_profile_' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--user-data-dir=' + profileDir
  ]);

  await sleep(2000);

  try {
    const tab = await fetchJson('http://127.0.0.1:9222/json/new?' + encodeURIComponent(TARGET_URL), 'PUT');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');
    await sendCdp(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Waiting for Vigil board to load...');
    await sleep(2500);

    // -------------------------------------------------------------
    // SCENE 1: Active Alerts Queue Overview
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 1: Active Alerts Board]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('board'); setLoopTypeFilter('all');` });
    await sleep(500);
    await captureFrame(ws, 'scene1_frame1.png');

    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        // Highlight critical Martha Reeve card
        const card = document.querySelector('.loop-card');
        if (card) { card.style.boxShadow = '0 0 0 3px #B91C1C'; }
      `
    });
    await sleep(500);
    await captureFrame(ws, 'scene1_frame2.png');

    // -------------------------------------------------------------
    // SCENE 2: Loop Detail, Arabic RTL, Accept Ownership
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 2: Case Ownership & Multilingual Callbacks]');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        openCardDetail('VGL-01-REEVE');
        document.getElementById('scriptLangSelect').value = 'ar';
        updateScriptLanguage();
      `
    });
    await sleep(700);
    await captureFrame(ws, 'scene2_frame1.png');

    // Click Accept Ownership
    await sendCdp(ws, 'Runtime.evaluate', { expression: `acceptSelectedLoop();` });
    await sleep(900);
    await captureFrame(ws, 'scene2_frame2.png');

    // -------------------------------------------------------------
    // SCENE 3: 1-Click Emergency Arrival Simulation
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 3: Emergency Arrival Simulation]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `injectChaosEmergency();` });
    await sleep(1000);
    await captureFrame(ws, 'scene3_frame1.png');
    await sleep(500);
    await captureFrame(ws, 'scene3_frame2.png');

    // -------------------------------------------------------------
    // SCENE 4: AI Safety Floor & Adversarial Stress Test
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 4: Adversarial Safety Guard Test]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `openAdversarialModal();` });
    await sleep(700);
    await captureFrame(ws, 'scene4_frame1.png');

    // Execute live adversarial test
    await sendCdp(ws, 'Runtime.evaluate', { expression: `executeAdversarialTest();` });
    await sleep(1200);
    await captureFrame(ws, 'scene4_frame2.png');

    await sendCdp(ws, 'Runtime.evaluate', { expression: `closeAdversarialModal();` });
    await sleep(400);

    // -------------------------------------------------------------
    // SCENE 5: 24h Night Shift Replay Simulation
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 5: 24h Night Shift Contrast]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('nightshift');` });
    await sleep(600);
    await captureFrame(ws, 'scene5_frame1.png');

    // Trigger simulation progress
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        toggleNightShiftPlay();
        VigilState.simTimeMinutes = 23 * 60; // Jump to late night
      `
    });
    await sleep(900);
    await captureFrame(ws, 'scene5_frame2.png');

    // -------------------------------------------------------------
    // SCENE 6: Cryptographic SHA-256 Ledger & Tamper Detection
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 6: Cryptographic SHA-256 Ledger]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('ledger'); verifyLedger();` });
    await sleep(800);
    await captureFrame(ws, 'scene6_frame1.png');

    // Simulate tamper
    await sendCdp(ws, 'Runtime.evaluate', { expression: `simulateTamper();` });
    await sleep(1100);
    await captureFrame(ws, 'scene6_frame2.png');

    // -------------------------------------------------------------
    // SCENE 7: Clinical Safety Outcomes & Outro
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 7: Clinical Outcomes & Outro]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('board'); setLoopTypeFilter('all');` });
    await sleep(600);
    await captureFrame(ws, 'scene7_frame1.png');

    ws.close();
    console.log('==> ALL SCENE FRAMES CAPTURED DIRECTLY FROM RUNNING APP!');
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Frame recording failed:', err);
  process.exit(1);
});
