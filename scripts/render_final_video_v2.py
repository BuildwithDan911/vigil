#!/usr/bin/env python3
"""
Assemble the final high-definition demo video from real app screen frames
and natural founder neural voiceover (en-US-ChristopherNeural).
"""
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "docs", "video_assets")
FINAL_MP4 = os.path.join(BASE_DIR, "docs", "vigil_demo_walkthrough.mp4")

SCENES = [
    {
        "id": "scene1",
        "audio": "scene1_v2.mp3",
        "frames": ["scene1_frame1.png", "scene1_frame2.png"]
    },
    {
        "id": "scene2",
        "audio": "scene2_v2.mp3",
        "frames": ["scene2_frame1.png", "scene2_frame2.png"]
    },
    {
        "id": "scene3",
        "audio": "scene3_v2.mp3",
        "frames": ["scene3_frame1.png", "scene3_frame2.png"]
    },
    {
        "id": "scene4",
        "audio": "scene4_v2.mp3",
        "frames": ["scene4_frame1.png", "scene4_frame2.png"]
    },
    {
        "id": "scene5",
        "audio": "scene5_v2.mp3",
        "frames": ["scene5_frame1.png", "scene5_frame2.png"]
    },
    {
        "id": "scene6",
        "audio": "scene6_v2.mp3",
        "frames": ["scene6_frame1.png", "scene6_frame2.png"]
    },
    {
        "id": "scene7",
        "audio": "scene7_v2.mp3",
        "frames": ["scene7_frame1.png"]
    }
]

def get_duration(media_file):
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", media_file
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def main():
    print("=" * 65)
    print("   Vigil Live App Multi-Tab Demo Video Assembler (V2)")
    print("=" * 65)

    scene_clips = []

    for idx, sc in enumerate(SCENES, 1):
        sid = sc["id"]
        audio_path = os.path.join(ASSETS_DIR, sc["audio"])
        clip_path = os.path.join(ASSETS_DIR, f"{sid}_clip_v2.mp4")
        dur = get_duration(audio_path)
        # Small 0.4s breathing buffer between scenes for natural pacing
        total_dur = dur + 0.4
        print(f"\n--> Rendering Scene {idx}/7 ({sid}) | Audio: {dur:.2f}s | Total: {total_dur:.2f}s")

        frames = [os.path.join(ASSETS_DIR, f) for f in sc["frames"]]

        if len(frames) == 1:
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", frames[0],
                "-i", audio_path,
                "-c:v", "libx264", "-tune", "stillimage",
                "-c:a", "aac", "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-t", str(total_dur),
                "-vf", "scale=1920:1080",
                clip_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        else:
            t1 = total_dur * 0.48
            t2 = total_dur - t1
            temp1 = os.path.join(ASSETS_DIR, f"{sid}_part1_v2.mp4")
            temp2 = os.path.join(ASSETS_DIR, f"{sid}_part2_v2.mp4")

            # Part 1 video
            subprocess.run([
                "ffmpeg", "-y", "-loop", "1", "-i", frames[0],
                "-t", str(t1), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-vf", "scale=1920:1080", temp1
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            # Part 2 video
            subprocess.run([
                "ffmpeg", "-y", "-loop", "1", "-i", frames[1],
                "-t", str(t2), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-vf", "scale=1920:1080", temp2
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            # Concat video parts and add audio
            concat_list = os.path.join(ASSETS_DIR, f"{sid}_concat_v2.txt")
            with open(concat_list, "w") as cf:
                cf.write(f"file '{temp1.replace(os.sep, '/')}'\n")
                cf.write(f"file '{temp2.replace(os.sep, '/')}'\n")

            cmd = [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0", "-i", concat_list,
                "-i", audio_path,
                "-c:v", "copy",
                "-c:a", "aac", "-b:a", "192k",
                "-t", str(total_dur),
                clip_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        scene_clips.append(clip_path)
        print(f"    Done: {clip_path}")

    # Final Concatenation
    print("\n--> Concatenating all 7 live scenes into master demo video...")
    master_list = os.path.join(ASSETS_DIR, "master_concat_v2.txt")
    with open(master_list, "w") as mf:
        for c in scene_clips:
            mf.write(f"file '{c.replace(os.sep, '/')}'\n")

    cmd_master = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", master_list,
        "-c", "copy",
        FINAL_MP4
    ]
    subprocess.run(cmd_master, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    final_size_mb = os.path.getsize(FINAL_MP4) / (1024 * 1024)
    final_dur = get_duration(FINAL_MP4)

    print("\n" + "=" * 65)
    print("SUCCESS! Final Live App Multi-Tab Demo Video Created:")
    print(f"  Path:       {FINAL_MP4}")
    print(f"  Duration:   {final_dur:.2f}s ({final_dur/60:.2f} minutes)")
    print(f"  File Size:  {final_size_mb:.2f} MB")
    print(f"  Resolution: 1080p Full HD (1920x1080)")
    print(f"  Voiceover:  en-US-ChristopherNeural (Natural Founder)")
    print("=" * 65)

if __name__ == "__main__":
    main()
