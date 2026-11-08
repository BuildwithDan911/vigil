/**
 * Record real app screen frames directly from http://localhost:8000/
 * Covers all 4 tabs and all interactive features:
 * Tab 1: Queue, Martha Reeve modal (Arabic RTL + English back-translation), Accept Ownership, 1-Click Emergency, Safety Guard adversarial refusal.
 * Tab 2: 24h Night Shift Replay simulation with live scrubber and side-by-side contrast.
 * Tab 3: Cryptographic SHA-256 Ledger (DPI-I-689) with live verification (green) and tamper detection (red).
 * Tab 4: Patient Privacy & Consent Gateway with automatic redactions.
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8000/';
const ASSETS_DIR = path.join(__dirname, '..', 'docs', 'video_assets');

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
  console.log('==> Starting Chrome for live multi-tab Vigil recording...');
  const profileDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome_record_profile_' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--user-data-dir=' + profileDir
  ]);

  await sleep(2500);

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
    // SCENE 1: Active Alerts Queue Overview (Tab 1)
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 1: Active Alerts Board]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('board'); setLoopTypeFilter('all');` });
    await sleep(600);
    await captureFrame(ws, 'scene1_frame1.png');

    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const card = document.querySelector('.loop-card');
        if (card) { 
          card.style.boxShadow = '0 0 0 4px #DC2626'; 
          card.style.transform = 'scale(1.02)';
          card.style.transition = 'all 0.3s ease';
        }
      `
    });
    await sleep(600);
    await captureFrame(ws, 'scene1_frame2.png');

    // -------------------------------------------------------------
    // SCENE 2: Detail Modal, Arabic RTL, Accept Ownership (Tab 1)
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 2: Martha Reeve Detail & Arabic Script]');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        openCardDetail('VGL-01-REEVE');
        const sel = document.getElementById('scriptLangSelect');
        if (sel) { sel.value = 'ar'; updateScriptLanguage(); }
      `
    });
    await sleep(800);
    await captureFrame(ws, 'scene2_frame1.png');

    // Click Accept Ownership
    await sendCdp(ws, 'Runtime.evaluate', { expression: `acceptSelectedLoop();` });
    await sleep(1000);
    await captureFrame(ws, 'scene2_frame2.png');

    // Close detail modal
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const m = document.getElementById('cardDetailModal');
        if (m) m.classList.add('hidden');
      `
    });
    await sleep(400);

    // -------------------------------------------------------------
    // SCENE 3: Emergency Simulation & AI Safety Floor (Tab 1)
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 3: Emergency Chaos & Safety Guard Refusal]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `injectChaosEmergency();` });
    await sleep(1000);
    await captureFrame(ws, 'scene3_frame1.png');

    // Open and run Safety Guard adversarial injection test
    await sendCdp(ws, 'Runtime.evaluate', { 
      expression: `
        openAdversarialModal(); 
        setTimeout(() => executeAdversarialTest(), 300);
      ` 
    });
    await sleep(1500);
    await captureFrame(ws, 'scene3_frame2.png');

    await sendCdp(ws, 'Runtime.evaluate', { expression: `closeAdversarialModal();` });
    await sleep(400);

    // -------------------------------------------------------------
    // SCENE 4: 24h Night Shift Replay Simulation (Tab 2)
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 4: 24h Night Shift Replay Tab]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('nightshift');` });
    await sleep(700);
    await captureFrame(ws, 'scene4_frame1.png');

    // Run simulation: advance time to 03:00 late night
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        toggleNightShiftPlay();
        if (typeof VigilState !== 'undefined') {
          VigilState.simTimeMinutes = 22 * 60 + 30;
          if (typeof renderNightShift === 'function') renderNightShift();
        }
      `
    });
    await sleep(1000);
    await captureFrame(ws, 'scene4_frame2.png');

    // -------------------------------------------------------------
    // SCENE 5: Cryptographic SHA-256 Ledger (Tab 3) - DPI-I-689
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 5: Cryptographic SHA-256 Ledger Tab]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('ledger'); verifyLedger();` });
    await sleep(800);
    await captureFrame(ws, 'scene5_frame1.png');

    // Simulate tamper detection
    await sendCdp(ws, 'Runtime.evaluate', { expression: `simulateTamper();` });
    await sleep(1200);
    await captureFrame(ws, 'scene5_frame2.png');

    // -------------------------------------------------------------
    // SCENE 6: Privacy & Patient Consent Gateway (Tab 4)
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 6: Patient Privacy & Consent Tab]');
    await sendCdp(ws, 'Runtime.evaluate', { expression: `switchTab('consent');` });
    await sleep(800);
    await captureFrame(ws, 'scene6_frame1.png');

    // Scroll down slightly to showcase redaction table and consent status
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `window.scrollBy({ top: 150, behavior: 'smooth' });`
    });
    await sleep(800);
    await captureFrame(ws, 'scene6_frame2.png');

    // -------------------------------------------------------------
    // SCENE 7: Full Loop Closure & Outro (Tab 1 Architecture)
    // -------------------------------------------------------------
    console.log('\n[Recording Scene 7: Full Outro & Overview]');
    await sendCdp(ws, 'Runtime.evaluate', { 
      expression: `
        window.scrollTo({ top: 0, behavior: 'instant' });
        switchTab('board'); 
        setLoopTypeFilter('all');
      ` 
    });
    await sleep(800);
    await captureFrame(ws, 'scene7_frame1.png');

    ws.close();
    console.log('\n==> ALL 7 SCENES (ALL 4 TABS) CAPTURED SUCCESSFULLY!');
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Frame recording failed:', err);
  process.exit(1);
});
