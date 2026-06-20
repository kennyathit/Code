# TG (Thai Airways) Pilot Study Tracker

A single shared spreadsheet for you and your study group to log practice scores
for the Thai Airways pilot recruitment aptitude test. Each member just adds one
row per practice attempt; the workbook automatically builds a scoreboard, ranks
which subject is **weakest and should be trained next**, lays out a daily
training schedule, tracks who's behind, and flags who hasn't submitted before the
deadline.

The spreadsheet is **generated from code** (`generate_tracker.py` + `config.yaml`)
so you can add members/subjects anytime and regenerate. Its real home is **Google
Sheets** — everyone has Google, and you share one link in LINE.

## The tabs

| Tab | What it's for |
|-----|---------------|
| **Scores** | The input log. Add one row per attempt: pick Member / Subject / Book from dropdowns, type `Correct` and `Total`. `%` is computed. This is your only data-entry job. |
| **Scoreboard** | Member × Subject grid of each person's **current** score (their most recent attempt), color-coded red→green, with per-person and group averages. |
| **Training Priority** | Subjects ranked **weakest → strongest** by group average, with gap-to-target and the weakest member per subject. This is the engine for "what do we train". |
| **Daily Schedule** | "Today we drill: ___" plus a rolling plan that walks the weakest subjects first. A *Manual override* column lets you pin a subject for a day. |
| **Gap Analysis** | Each member's gap vs the group average per subject (green = ahead, red = behind) so the group can level up whoever's lagging. |
| **Submission Status** | For the current round: each member's last submission, attempts this round, and a `submitted ✓ / pending / LATE — missing` flag against the deadline. |
| **Books** | Your study materials: which subject each book trains, where to get it, who you've sent it to, and status. |
| **Config** | The control panel: members, subjects, per-subject targets, books, the deadline, round start, and today's date. Editing these updates every dashboard live. |

## Quick start

### 1. Get the Sheet into Google
1. Go to **drive.google.com → New → File upload** and upload
   `TG_Pilot_Study_Tracker.xlsx`.
2. Right-click it → **Open with → Google Sheets**.
3. **File → Save as Google Sheets** (this makes the dynamic tabs — Training
   Priority, Daily Schedule — calculate). The dynamic tabs use Google Sheets'
   `SORT`/`FILTER`, which activate once it's a real Google Sheet.

### 2. Share it with the group
- **Share** (top-right) → set "Anyone with the link" to **Editor** → copy the
  link → paste it in your LINE group. Done — no Google Form needed.

### 3. How members log a score
On the **Scores** tab, add a row: Date, pick your name, pick the subject, pick the
book, type how many you got `Correct` out of the `Total`. That's it — the
scoreboard, priority, schedule, gaps, and submission status all update.

### 4. How you (admin) run a round
- On **Config**, set **Submission Deadline** and **Round Start** dates.
- Tell the group in LINE to submit before the deadline.
- Watch **Submission Status** for `pending` / `LATE — missing`.
- Open **Daily Schedule** each day to see what to drill (weakest first).

## Adding subjects / members / books

Two ways:

- **Easiest (live):** edit the lists directly on the **Config** tab in Google
  Sheets. Dashboards pick them up automatically (up to 20 members and 30 subjects).
- **Clean rebuild:** edit `config.yaml`, then regenerate:

  ```bash
  pip install openpyxl pyyaml
  python3 generate_tracker.py          # writes TG_Pilot_Study_Tracker.xlsx
  python3 generate_tracker.py --demo   # also writes a sample-data copy to preview
  ```

  Re-import the new `.xlsx` to Google Drive.

## How "weakest → strongest" is calculated

1. Every attempt is normalized to a percentage: `Correct ÷ Total`.
2. A member's **current** standing on a subject = their **most recent** attempt
   (so improvement shows immediately).
3. A subject's **group** score = the average of members' current scores on it.
4. **Training Priority** sorts subjects by that group score, lowest first — the
   weakest subject is what the group drills next.
5. **Gap Analysis** compares each member to the group average and to the target,
   highlighting who is behind on what.

## Files

- `generate_tracker.py` — builds the workbook from `config.yaml`.
- `config.yaml` — the one file you edit (members, subjects, targets, books, dates).
- `TG_Pilot_Study_Tracker.xlsx` — the clean, ready-to-import workbook.
- `TG_Pilot_Study_Tracker_DEMO.xlsx` — same workbook seeded with sample scores so
  you can see every dashboard working before you start.
- `requirements.txt` — Python dependencies (`openpyxl`, `pyyaml`).
