#!/usr/bin/env python3
"""
Generate fast-paced, natural voiceover tracks for Vigil using Microsoft Neural Voice (en-US-GuyNeural).
"""
import os
import subprocess
import asyncio
import edge_tts

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "video_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "en-US-GuyNeural"
# Pacing: rate=+8% to keep it brisk, crisp, and high-energy
RATE = "+8%"
PITCH = "+0Hz"

NARRATIONS = [
    {
        "id": "scene1",
        "text": "Over 40% of abnormal lab results and specialist referrals return after hospital discharge. When doctors clock off, these results sit in closed inboxes. This is Vigil for InterSystems IRIS for Health, an autonomous safety net that guarantees no diagnostic handoff is abandoned."
    },
    {
        "id": "scene2",
        "text": "Reviewing Martha Reeve's critical hyperkalemia, Vigil generates culturally vetted callback scripts in six languages. Selecting Arabic flips the interface to native right to left with a verified English back-translation, and Dr. Mensah claims ownership with one click."
    },
    {
        "id": "scene3",
        "text": "When an emergency result arrives post-discharge, Vigil autonomously verifies the discharging physician is off-shift, re-routes the case to on-duty staff, and arms a strict 2-hour clinical SLA timer."
    },
    {
        "id": "scene4",
        "text": "To prevent dangerous AI hallucinations, Vigil enforces a deterministic safety floor. When an adversarial prompt attempts to downgrade a lethal potassium of 6.8, Vigil intercepts the attack, locks urgency at critical, and logs the refusal."
    },
    {
        "id": "scene5",
        "text": "Our 24-hour Night Shift replay contrasts operational safety: with Vigil, 100% of critical handoffs are owned. Without Vigil, traditional hospital inboxes leave three patients unmonitored for an average delay of 14 hours."
    },
    {
        "id": "scene6",
        "text": "Every clinical handoff is hashed into an immutable SHA-256 ledger inside the IRIS database. Verification is instant, and any unauthorized database tampering breaks the hash chain and raises an automated alert."
    },
    {
        "id": "scene7",
        "text": "100% loop closure, zero patients lost. Vigil for InterSystems IRIS for Health, closing the diagnostic loop so no patient falls through the cracks."
    }
]

async def generate_scene_audio(item):
    sid = item["id"]
    text = item["text"]
    out_path = os.path.join(OUTPUT_DIR, f"{sid}_neural.mp3")
    print(f"--> Generating neural speech for {sid}...")
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(out_path)
    print(f"    Saved: {out_path}")

async def main():
    print("=" * 60)
    print("   Vigil Neural Voiceover Generator (en-US-GuyNeural)")
    print("=" * 60)
    for item in NARRATIONS:
        await generate_scene_audio(item)
    print("\nAll 7 neural voice tracks generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
