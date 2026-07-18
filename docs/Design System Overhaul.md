# Design System Overhaul - TCS iON Steel Blue Theme

This document defines the official design system, visual tokens, and interface behaviors for the **iONMirror CBT Lab** simulator. The entire application (Landing, Setup, Generator, Exam, and Summary) uses this unified palette to ensure styling consistency and visual authenticity.

---

## 1. Color Palette Tokens

The core colors are inspired by the standard steel-blue TCS iON interface.

| Token Variable | Hex Code | Purpose |
|---|---|---|
| `--cbt-steel-blue` | `#334155` | Primary headers, active states, buttons, bold text |
| `--cbt-steel-blue-dark` | `#1e293b` | Accent hover colors, secondary headers |
| `--cbt-bg-light` | `#f8fafc` | Screen background for clean workspace panels |
| `--cbt-sidebar-bg` | `#f1f5f9` | Background for palette sidebars and content frames |
| `--cbt-border` | `#cbd5e1` | Thin borders, panel dividers, table cells |
| `--cbt-text-main` | `#334155` | Body text, question text, titles |
| `--cbt-text-muted` | `#64748b` | Sub-labels, legends, candidate IDs, helper captions |
| `--cbt-timer-bg` | `#0f172a` | Countdown timer background box |
| `--cbt-timer-green` | `#10b981` | Safe timer countdown status text |
| `--cbt-timer-red` | `#ef4444` | Urgent timer countdown status text (< 5 minutes) |

---

## 2. Typography and Visual Density

- **Font Family**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`.
- **Text Sizing**: Compact sizing ranging from `9px` (candidate sub-ID) to `24px` (large card titles).
- **Line Heights**: Muted line heights (`1.4` to `1.6`) to maintain a realistic, dense visual style characteristic of traditional testing environments.

---

## 3. UI Component Specifications

### 3.1 Primary Header Bar
- **Background**: `--cbt-steel-blue` (`#334155`).
- **Layout**: Sticky top placement, height `48px`.
- **Timer Sub-Panel**: Uses `--cbt-timer-bg` (`#0f172a`) background with `--cbt-timer-green` (`#10b981`) text.

### 3.2 Candidate Info Panel
- Display text aligned to the right.
- Profile photo avatar colored in `--cbt-border` (`#cbd5e1`) background, displaying a dark vector outline.

### 3.3 Question Palette Tiles
- **Not Visited**: `#e2e8f0` background, `#cbd5e1` border.
- **Visited but Unanswered**: `#e53e3e` background with a curved top.
- **Answered**: `#38a169` background with a curved bottom.
- **Marked for Review**: `#805ad5` background, circular shape.
- **Answered & Marked**: `#805ad5` background, circular shape with a small `#38a169` green dot at the bottom right.

### 3.4 Buttons
- **Primary Buttons**: Steel-blue background (`#3182ce` or `#334155` styled variant) with a dark slate hover effect.
- **Secondary Buttons**: Light grey background (`#e2e8f0`) with dark slate text.
- **Danger / Submit Buttons**: Muted red/orange (`#dd6b20` or `#e53e3e`) styled variant.
