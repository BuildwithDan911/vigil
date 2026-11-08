const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'docs', 'video_assets');
const FINAL_MP4 = path.join(BASE_DIR, 'docs', 'vigil_demo_walkthrough.mp4');

const SCENES = [
  {
    id: 'scene1',
    audio: 'scene1_v2.mp3',
    frames: ['scene1_frame1.png', 'scene1_frame2.png']
  },
  {
    id: 'scene2',
    audio: 'scene2_v2.mp3',
    frames: ['scene2_frame1.png', 'scene2_frame2.png']
  },
  {
    id: 'scene3',
    audio: 'scene3_v2.mp3',
    frames: ['scene3_frame1.png', 'scene3_frame2.png']
  },
  {
    id: 'scene4',
    audio: 'scene4_v2.mp3',
    frames: ['scene4_frame1.png', 'scene4_frame2.png']
  },
  {
    id: 'scene5',
    audio: 'scene5_v2.mp3',
    frames: ['scene5_frame1.png', 'scene5_frame2.png']
  },
  {
    id: 'scene6',
    audio: 'scene6_v2.mp3',
    frames: ['scene6_frame1.png', 'scene6_frame2.png']
  },
  {
    id: 'scene7',
    audio: 'scene7_v2.mp3',
    frames: ['scene7_frame1.png']
  }
];

function getDuration(filePath) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  return parseFloat(out.trim());
}

async function run() {
  console.log('===============================================================');
  console.log('   Vigil Demo Walkthrough Video Assembler (Fast 1-Pass)');
  console.log('===============================================================');

  const clipPaths = [];

  for (let i = 0; i < SCENES.length; i++) {
    const sc = SCENES[i];
    const audioPath = path.join(ASSETS_DIR, sc.audio);
    const clipPath = path.join(ASSETS_DIR, `${sc.id}_out.mp4`);
    const dur = getDuration(audioPath);
    console.log(`\n--> [Scene ${i + 1}/7] ${sc.id} | Audio: ${dur.toFixed(2)}s`);

    const concatTxt = path.join(ASSETS_DIR, `${sc.id}_input.txt`);
    let fileContent = '';

    if (sc.frames.length === 1) {
      const fPath = path.join(ASSETS_DIR, sc.frames[0]).replace(/\\/g, '/');
      fileContent = `file '${fPath}'\nduration ${dur.toFixed(2)}\nfile '${fPath}'\n`;
    } else {
      const t1 = (dur * 0.48).toFixed(2);
      const t2 = (dur - t1).toFixed(2);
      const f1 = path.join(ASSETS_DIR, sc.frames[0]).replace(/\\/g, '/');
      const f2 = path.join(ASSETS_DIR, sc.frames[1]).replace(/\\/g, '/');
      fileContent = `file '${f1}'\nduration ${t1}\nfile '${f2}'\nduration ${t2}\nfile '${f2}'\n`;
    }

    fs.writeFileSync(concatTxt, fileContent);

    const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatTxt}" -i "${audioPath}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -r 2 -c:a aac -b:a 192k -shortest -vf "scale=1920:1080" "${clipPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    clipPaths.push(clipPath);
    console.log(`    Generated: ${clipPath}`);
  }

  console.log('\n--> Concatenating all scenes into master video...');
  const masterTxt = path.join(ASSETS_DIR, 'master_list.txt');
  let masterContent = '';
  for (const c of clipPaths) {
    masterContent += `file '${c.replace(/\\/g, '/')}'\n`;
  }
  fs.writeFileSync(masterTxt, masterContent);

  const finalCmd = `ffmpeg -y -f concat -safe 0 -i "${masterTxt}" -c copy "${FINAL_MP4}"`;
  execSync(finalCmd, { stdio: 'inherit' });

  const finalDur = getDuration(FINAL_MP4);
  const stats = fs.statSync(FINAL_MP4);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n===============================================================');
  console.log('SUCCESS! Video assembly complete:');
  console.log(`  Output Path: ${FINAL_MP4}`);
  console.log(`  Duration:    ${finalDur.toFixed(2)}s (${(finalDur / 60).toFixed(2)} min)`);
  console.log(`  File Size:   ${sizeMb} MB`);
  console.log('===============================================================');
}

run().catch(err => {
  console.error('Video assembly failed:', err);
  process.exit(1);
});
