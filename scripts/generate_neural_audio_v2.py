#!/usr/bin/env python3
"""
Generate natural, human-like voiceover tracks for Vigil demo using en-US-ChristopherNeural.
"""
import os
import asyncio
import edge_tts

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "video_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE = "en-US-ChristopherNeural"
RATE = "+3%"   # Warm, natural human cadence (not rushed, not slow)
PITCH = "+0Hz"

NARRATIONS = [
    {
        "id": "scene1",
        "text": "Hey everyone, I'm Daniel. In modern healthcare, over 40% of critical lab results return after patients have already been discharged. When clinicians clock off, these results can easily sit unnoticed in an inbox. This is Vigil, built natively on InterSystems IRIS for Health. Right here on our live triage queue, Vigil monitors interoperability streams in real time. Martha Reeve's potassium came back dangerously high at 6.8, and Vigil immediately surfaced her case with an active countdown timer before her clinical safety window breaches."
    },
    {
        "id": "scene2",
        "text": "Let's click into Martha Reeve's case. Instead of generic alerts, Vigil drafts clinically vetted outreach in six languages. Watch as we toggle to Arabic: the interface flips to native right-to-left script, with a verified English back-translation so the clinician knows exactly what the patient receives. When Dr. Mensah clicks Accept Ownership, the assignment locks into IRIS instantly."
    },
    {
        "id": "scene3",
        "text": "We can also test sudden hospital chaos. With one click, we simulate an emergency arrival, automatically rerouting the case to on-duty staff. And look what happens when someone attempts an adversarial prompt injection to downgrade Martha's lethal potassium: Vigil's deterministic safety floor intercepts the attack, locking urgency at critical and logging the refusal."
    },
    {
        "id": "scene4",
        "text": "Now let's switch over to our 24-hour Night Shift Replay tab. Watch what happens when we start the simulation: we can scrub through an entire 24-hour cycle. Notice the contrast on the right: without Vigil, three critical patients slipped through the cracks overnight due to fatigue and delays. With Vigil, 100% of critical handoffs were intercepted and acknowledged within their clinical window."
    },
    {
        "id": "scene5",
        "text": "Directly addressing Idea DPI-I-689 on the InterSystems Ideas Portal, every single AI decision and clinical handoff is sealed into a tamper-evident SHA-256 hash chain inside IRIS. When we verify the ledger, the entire chain confirms green. And if anyone attempts unauthorized database tampering, Vigil instantly flags the exact corrupted block and halts execution."
    },
    {
        "id": "scene6",
        "text": "Moving to our Privacy and Consent Gateway, Vigil enforces strict patient communication preferences. Sensitive diagnostic details are automatically redacted before external notifications are dispatched, ensuring zero patient privacy leaks."
    },
    {
        "id": "scene7",
        "text": "Built end-to-end on InterSystems IRIS for Health Interoperability, Vigil transforms disconnected clinical feeds into an autonomous, verifiable safety net. Zero patients lost. Thanks for watching!"
    }
]

async def generate_scene_audio(item):
    sid = item["id"]
    text = item["text"]
    out_path = os.path.join(OUTPUT_DIR, f"{sid}_v2.mp3")
    print(f"--> Generating neural speech for {sid} ({VOICE})...")
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(out_path)
    print(f"    Saved: {out_path}")

async def main():
    print("=" * 65)
    print(f"   Vigil Founder Voice Generator ({VOICE})")
    print("=" * 65)
    for item in NARRATIONS:
        await generate_scene_audio(item)
    print("\nAll 7 audio tracks generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
