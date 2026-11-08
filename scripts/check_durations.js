const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '..', 'docs', 'video_assets');

for (let i = 1; i <= 7; i++) {
  const p = path.join(ASSETS_DIR, `scene${i}_v2.mp3`);
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`;
  const dur = parseFloat(execSync(cmd).toString().trim());
  console.log(`Scene ${i}: ${dur.toFixed(2)} seconds`);
}
