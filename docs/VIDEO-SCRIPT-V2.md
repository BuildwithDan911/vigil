# Vigil Demo Walkthrough Script (V2 - Natural Founder Dialogue)

**Presenter:** Daniel John  
**Voice Profile:** Warm, confident, natural founder conversational tone  
**Target Duration:** ~100–120 seconds  

---

## Scene 1: The Problem & The Active Queue (Tab 1)
**Visual:** Active Alerts Queue on `http://localhost:8000/`. Panning over high-priority patient cards (Martha Reeve, Samuel Okai).  
**Audio (Voiceover):**  
"Hey everyone, I'm Daniel. In modern hospitals, critical lab results often come back hours after a patient has already been discharged. If no one catches them in time, the consequences can be fatal. That's why we built Vigil. Right here on our live triage queue, Vigil monitors InterSystems IRIS interoperability streams in real time. Notice Martha Reeve at the top—her potassium just came back critically high at 6.8, and Vigil immediately flagged her with an active countdown timer before her safety SLA breaches."

---

## Scene 2: Multilingual Outreach & Clinician Ownership (Tab 1 Modal)
**Visual:** Opening Martha Reeve's detail modal. Clinician flips the outreach message to Arabic (RTL script displays with English back-translation), then clicks 'Accept Ownership'.  
**Audio (Voiceover):**  
"Let's open Martha's case. Vigil doesn't just send robotic alerts; it drafts culturally and linguistically verified clinical outreach. Watch as we toggle to Arabic: the interface switches to right-to-left script, complete with a verified English back-translation so the clinician knows exactly what the patient receives. When Dr. Mensah clicks Accept Ownership, the assignment locks into IRIS instantly."

---

## Scene 3: 1-Click Emergency Simulation & AI Safety Guard (Tab 1 Live Actions)
**Visual:** Clicking 'Simulate Emergency Arrival' (red high-priority emergency card pops up), then clicking 'Test Safety Guard' (live prompt injection test against IRIS container showing downgrade blocked).  
**Audio (Voiceover):**  
"We can even simulate a live critical emergency arrival with one click. And look at what happens when an adversarial prompt injection tries to trick the AI into downgrading a critical patient: Vigil's deterministic safety floor intercepts it inside InterSystems IRIS, completely blocking the downgrade."

---

## Scene 4: The 24-Hour Night Shift Replay (Tab 2)
**Visual:** Switching to '24h Shift Replay' tab. Clicking 'Run Simulation'. The playback scrubber advances from 8 PM to 8 AM, showing hospital beds and side-by-side comparison metrics.  
**Audio (Voiceover):**  
"Now let's switch over to our 24-hour Night Shift Replay. When we hit run simulation, you can see hospital shift events replayed in real time. Look at the stark contrast on the right: without Vigil, three critical patients slipped through the cracks overnight due to fatigue and delays. With Vigil, 100% of critical events were intercepted and acknowledged within their clinical window."

---

## Scene 5: Cryptographic Safety Audit Log (Tab 3)
**Visual:** Switching to 'Safety Audit Log' tab. Inspecting SHA-256 chained blocks. Clicking 'Verify Cryptographic Chain' (green verified badge), then clicking 'Simulate Tamper' (red Block #2 corruption warning and recovery).  
**Audio (Voiceover):**  
"Directly addressing Idea DPI-I-689 on the InterSystems Ideas Portal, every single AI decision is sealed into a tamper-evident cryptographic hash chain. Let's verify the chain right now—all blocks validate perfectly in green. And if someone attempts to manipulate the audit log, our tamper test flags the exact corrupted block instantly."

---

## Scene 6: Privacy & Patient Consent Gateway (Tab 4)
**Visual:** Switching to 'Privacy & Consent' tab. Showing patient consent opt-ins and automatic diagnostic redactions.  
**Audio (Voiceover):**  
"Finally, here's our Privacy and Consent Gateway. Vigil strictly enforces patient communication preferences and automatically redacts sensitive diagnostic details before external notifications are ever dispatched."

---

## Scene 7: Conclusion & InterSystems IRIS Integration
**Visual:** Return to main dashboard with all green system health indicators and InterSystems IRIS interoperability production status.  
**Audio (Voiceover):**  
"Built end-to-end on InterSystems IRIS for Health, Vigil transforms disconnected interoperability feeds into an autonomous, verifiable safety net for every discharged patient. Thanks for watching!"
