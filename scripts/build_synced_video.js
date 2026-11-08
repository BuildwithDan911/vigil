const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'docs', 'video_assets');
const FINAL_MP4 = path.join(BASE_DIR, 'docs', 'vigil_demo_walkthrough.mp4');
const SUBTITLES_FILE = path.join(BASE_DIR, 'docs', 'vigil_subtitles.srt');

function getDuration(filePath) {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  return parseFloat(out.trim());
}

async function run() {
  console.log('===============================================================');
  console.log('   Vigil Demo Walkthrough Video - 5s Delayed Sync + Subtitles');
  console.log('===============================================================');

  // Step 1: Create Scene 1 with 5.0 seconds of establishing pause at the start
  console.log('\n--> Step 1: Prepending 5.0s intro pause to Scene 1 audio...');
  const scene1Orig = path.join(ASSETS_DIR, 'scene1_v2.mp3');
  const scene1DelayedAudio = path.join(ASSETS_DIR, 'scene1_delayed.mp3');
  // Delay audio by 5000ms
  const delayCmd = `ffmpeg -y -i "${scene1Orig}" -af "adelay=5000|5000" -c:a mp3 "${scene1DelayedAudio}"`;
  execSync(delayCmd, { stdio: 'inherit' });
  console.log('    Created 5-second delayed audio for Scene 1');

  // Scene specs with exact frame split times tailored to voice cues:
  const SCENE_CONFIGS = [
    {
      id: 'scene1',
      audio: 'scene1_delayed.mp3',
      // Total dur: 5.0s intro + 36.26s audio = 41.26s
      // Frame 1 (overview): 25.0s (covers 5s intro + first 20s of problem statement)
      // Frame 2 (Martha Reeve critical highlight): remaining 16.26s
      split: 25.0,
      frames: ['scene1_frame1.png', 'scene1_frame2.png']
    },
    {
      id: 'scene2',
      audio: 'scene2_v2.mp3',
      // Total dur: 24.62s
      // Frame 1 (detail modal & Arabic toggle): 14.5s
      // Frame 2 (Accept ownership toast & lock): remaining 10.12s
      split: 14.5,
      frames: ['scene2_frame1.png', 'scene2_frame2.png']
    },
    {
      id: 'scene3',
      audio: 'scene3_v2.mp3',
      // Total dur: 22.42s
      // Frame 1 (Emergency arrival simulation): 10.0s
      // Frame 2 (Safety guard prompt injection refusal): remaining 12.42s
      split: 10.0,
      frames: ['scene3_frame1.png', 'scene3_frame2.png']
    },
    {
      id: 'scene4',
      audio: 'scene4_v2.mp3',
      // Total dur: 24.94s
      // Frame 1 (24h Night shift tab start): 9.5s
      // Frame 2 (simulation progressed, side-by-side contrast): remaining 15.44s
      split: 9.5,
      frames: ['scene4_frame1.png', 'scene4_frame2.png']
    },
    {
      id: 'scene5',
      audio: 'scene5_v2.mp3',
      // Total dur: 25.44s
      // Frame 1 (Cryptographic SHA-256 ledger verified green): 11.5s
      // Frame 2 (Simulate tamper detection red alert): remaining 13.94s
      split: 11.5,
      frames: ['scene5_frame1.png', 'scene5_frame2.png']
    },
    {
      id: 'scene6',
      audio: 'scene6_v2.mp3',
      // Total dur: 15.31s
      // Frame 1 (Consent gateway rules): 7.0s
      // Frame 2 (Diagnostic redactions table): remaining 8.31s
      split: 7.0,
      frames: ['scene6_frame1.png', 'scene6_frame2.png']
    },
    {
      id: 'scene7',
      audio: 'scene7_v2.mp3',
      // Total dur: 13.87s (+ 2s outro hold = 15.87s)
      frames: ['scene7_frame1.png'],
      holdExtra: 2.0
    }
  ];

  const clipPaths = [];

  for (let i = 0; i < SCENE_CONFIGS.length; i++) {
    const sc = SCENE_CONFIGS[i];
    const audioPath = path.join(ASSETS_DIR, sc.audio);
    const clipPath = path.join(ASSETS_DIR, `${sc.id}_synced.mp4`);
    const dur = getDuration(audioPath);
    const totalDur = sc.holdExtra ? dur + sc.holdExtra : dur;
    console.log(`\n--> [Scene ${i + 1}/7] ${sc.id} | Audio: ${dur.toFixed(2)}s | Total: ${totalDur.toFixed(2)}s`);

    const concatTxt = path.join(ASSETS_DIR, `${sc.id}_synced_input.txt`);
    let fileContent = '';

    if (sc.frames.length === 1) {
      const fPath = path.join(ASSETS_DIR, sc.frames[0]).replace(/\\/g, '/');
      fileContent = `file '${fPath}'\nduration ${totalDur.toFixed(2)}\nfile '${fPath}'\n`;
    } else {
      const t1 = sc.split.toFixed(2);
      const t2 = (totalDur - sc.split).toFixed(2);
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

  // Concatenate scenes
  console.log('\n--> Concatenating synced scenes into raw master video...');
  const masterRaw = path.join(ASSETS_DIR, 'master_raw_synced.mp4');
  const masterTxt = path.join(ASSETS_DIR, 'master_synced_list.txt');
  let masterContent = '';
  for (const c of clipPaths) {
    masterContent += `file '${c.replace(/\\/g, '/')}'\n`;
  }
  fs.writeFileSync(masterTxt, masterContent);

  const rawCmd = `ffmpeg -y -f concat -safe 0 -i "${masterTxt}" -c copy "${masterRaw}"`;
  execSync(rawCmd, { stdio: 'inherit' });
  console.log(`    Raw master created: ${masterRaw}`);

  // Burn in subtitles
  console.log('\n--> Burning in stylized subtitles into final video...');
  const srtRel = 'docs/vigil_subtitles.srt';
  const subtitleFilter = `subtitles=${srtRel}:force_style='FontSize=14,FontName=Arial,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0.5,MarginV=30,Alignment=2'`;
  const burnCmd = `ffmpeg -y -i "${masterRaw}" -vf "${subtitleFilter}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a copy "${FINAL_MP4}"`;
  execSync(burnCmd, { stdio: 'inherit' });

  const finalDur = getDuration(FINAL_MP4);
  const stats = fs.statSync(FINAL_MP4);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n===============================================================');
  console.log('SUCCESS! Perfectly Synced & Subtitled Video Complete:');
  console.log(`  Output Path:   ${FINAL_MP4}`);
  console.log(`  Duration:      ${finalDur.toFixed(2)}s (${(finalDur / 60).toFixed(2)} min)`);
  console.log(`  File Size:     ${sizeMb} MB`);
  console.log(`  Audio Delay:   5.0s establishing intro pause at beginning`);
  console.log(`  Subtitles:     Burned-in Arial Bold with outline, bottom-centered`);
  console.log('===============================================================');
}

run().catch(err => {
  console.error('Build synced video failed:', err);
  process.exit(1);
});
