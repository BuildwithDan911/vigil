# UI Polish & Accessibility Quality Assurance Checklist (Phase 15)

All items below have been audited and verified against `kit/specs/design-system.md` and `kit/specs/ui-spec.md`.

## 1. Design System & Palette Compliance
- [x] Background palette `#F4F1EA` strictly applied to body, top-level containers, and views.
- [x] Primary text ink `#15233B` applied universally (zero pure `#000000` text).
- [x] Typography family: IBM Plex Sans for body/headings, IBM Plex Mono for timestamps, hashes, codes, and telemetry.
- [x] Border line tint `#D6D0C4` applied to cards, lanes, and tables.
- [x] Urgency tokens applied:
  - Critical: `#9B1C1C` with tint `#FDE8E8`
  - Urgent: `#854D0E` with tint `#FEF08A`
  - Routine: `#0F6E56` with tint `#DEF7EC`
  - Safe: `#0F6E56`
  - Accent / Primary: `#0B4F6C`
- [x] WCAG 2.2 AA Contrast: All text elements meet or exceed 4.5:1 contrast against their rendered backgrounds.
- [x] Color-blind accessibility: Every badge and lane combines shape/icon with color (`◆ Critical`, `▲ Urgent`, `● Routine`).

## 2. Mandatory Disclaimers
- [x] Persistent synthetic data disclaimer displayed across top banner and footer:
  > *"Synthetic Harbourview General Hospital data — demonstration environment only. Not a medical device; not for use on real patients. Framing aligns with patient-safety communication standards inspired by the WHO Global Patient Safety Action Plan 2021–2030 (Design Standard Only; Not a WHO commission, certification, or endorsement)."*
- [x] Replay mode indicator clearly distinguished: *"Recorded Replay — No Live AI Calls"*.

## 3. Responsive Screen Layouts & Screenshots
- [x] Desktop (1440×900) and Mobile (375×812) verified and saved to `docs/screenshots/`:
  - [x] `board-1440.png` — Ward Board 4 lanes, filters, hero counter, mission banner.
  - [x] `board-375.png` — Mobile single-column stacked triage list.
  - [x] `detail-1440.png` — Loop Detail modal, DPI-I-689 trace box, callback script.
  - [x] `detail-375.png` — Mobile Loop Detail with **English back-translation clearly visible**.
  - [x] `nightshift-split-1440.png` — 90s player + side-by-side "With Vigil" vs "Without Vigil" contrast.
  - [x] `nightshift-split-375.png` — Mobile stacked view of With vs Without Vigil comparison.
  - [x] `report-1440.png` — Safety Report 4 KPI cards + literature citations.
  - [x] `report-375.png` — Mobile 2×2 KPI metric cards and summary citations.

## 4. Multilingual & RTL Support
- [x] 6 clinical languages supported: English (`en`), French (`fr`), Spanish (`es`), Arabic (`ar`), Portuguese (`pt`), Swahili (`sw`).
- [x] Arabic script enforces `dir="rtl"` and right-to-left layout rendering.
- [x] English back-translation provided for all foreign-language call scripts.

## 5. Keyboard Navigation & Accessibility
- [x] Focus outline `2px solid var(--vigil-accent)` present on interactive controls.
- [x] Modal traps focus and closes via `Esc` or Close button.
- [x] ARIA live region (`aria-live="polite"`) configured on hero counter (`heroCount`).
- [x] Semantic HTML5 tags (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`).
