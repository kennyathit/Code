# TG Pilot Study — Web Platform

A browser-based study platform for the Thai Airways (TG) pilot recruitment group.
Works on **any device** (Mac, Windows, Android, iPhone) — it's a website, so everyone
just opens the same link. No installs for members.

**What it does**
- Members submit practice scores (correct ÷ total) per subject.
- A live **scoreboard**, **weakest → strongest training priority**, and a
  "**Today the group drills: ___**" recommendation.
- **Gap analysis** — who's behind the group on which subject.
- **Materials (Google-Classroom style):** the admin uploads a book/test **PDF** with a
  **type/subject**, **max score**, **time limit**, **deadline**, and **instructions**;
  everyone downloads it; the platform tracks who has it. Picking an assignment when you
  submit a score auto-fills its subject and max score.
- **Submission status** vs the deadline (submitted / pending / late).

---

## Run it on your computer (Windows, at `C:\TG WEBSITE STUDY`)

> This project is built in the cloud and pushed to GitHub. To get it onto your PC at
> `C:\TG WEBSITE STUDY`, do this once.

1. **Install Node.js** (LTS) from <https://nodejs.org> — accept defaults.
2. **Install Git** from <https://git-scm.com> (or download the repo as a ZIP from GitHub).
3. Open **Command Prompt** (or PowerShell) and run:

   ```bat
   cd C:\
   git clone -b claude/thai-airways-study-system-udgcir <YOUR_REPO_URL> "TG WEBSITE STUDY"
   cd "C:\TG WEBSITE STUDY\platform"
   npm install
   npm run setup        :: creates the database + loads members/subjects from config.yaml
   npm run dev
   ```

   (To also load sample data so you can see it working immediately:
   `npx tsx prisma/seed.ts --demo`)

4. Open **http://localhost:3000** in your browser.

> **Even easier:** after step 1–2, just **double-click `start.bat`** (Windows) or run
> `./start.sh` (Mac) inside the `platform` folder. It installs everything on first run,
> sets up the database, starts the server, and opens your browser automatically.

> If you downloaded the ZIP instead of cloning, unzip it to `C:\TG WEBSITE STUDY`, then
> `cd "C:\TG WEBSITE STUDY\platform"` and run the `npm` commands above.

### Using it
- Top-right: **pick your name**. The first member in `config.yaml` is the **admin**
  (can upload materials + set deadlines). Everyone else just submits scores & downloads.
- **Submit score** → choose subject, type correct & total (or pick an assignment to
  auto-fill), save.
- **Materials** (admin) → fill in title, subject, max score, time limit, deadline,
  instructions, choose the PDF, **Upload & share**. Members click **Download**.

### Change the group / subjects
Edit `../config.yaml` (the same file the spreadsheet used), then re-run
`npm run setup`. Members & subjects are added; existing scores are kept.

---

## Share it with the whole group for free (deploy)

Members on different devices need a public URL. Permanently-free stack (not the 1-hour
trials — that was Railway credits running out): **Vercel** hosts the site, **Supabase**
holds the database + the PDF files. The code is already wired for both — no code edits
needed, just config.

### Step 1 — Supabase (database + PDF storage)
1. Sign up at <https://supabase.com> and create a **New project** (pick a region near
   Thailand, e.g. Singapore). Save the database password.
2. **Storage** (left sidebar) ▸ **New bucket** ▸ name it `materials` ▸ create.
3. **Project Settings ▸ API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`
4. **Project Settings ▸ Database ▸ Connection string ▸ URI** (the pooled one, port
   6543), copy it and put your password in → `DATABASE_URL`.

### Step 2 — Create the tables + seed (run once from your computer)
In `C:\TG WEBSITE STUDY\platform`, create a file named `.env` containing the four values
above (see `.env.example`), then:
```bat
npm run setup:prod
```
This creates the tables in Supabase and loads members/subjects from `config.yaml`.

### Step 3 — Vercel (hosting)
1. Sign in at <https://vercel.com> **with GitHub** and **Import** this repository.
2. Set **Root Directory** to `platform`. (Build command is already configured by
   `vercel.json` → `npm run build:prod`.)
3. **Environment Variables** — add all four: `DATABASE_URL`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` = `materials`.
4. **Deploy**. When it finishes you get a URL like `https://tg-pilot-study.vercel.app`.

### Step 4 — Share
Paste the Vercel URL in your LINE group. It opens on Mac, Windows, Android, iPhone —
members pick their name, submit scores, and download the PDFs you upload.

> Updating later: push to the branch → Vercel redeploys automatically. If you add many new
> members/subjects in `config.yaml`, run `npm run setup:prod` again to sync them.

---

## Tech
Next.js (App Router) · Prisma (SQLite local → Postgres for deploy) · Tailwind CSS.
Ranking logic lives in `lib/metrics.ts`; storage in `lib/storage.ts`; data model in
`prisma/schema.prisma`; seed reads `config.yaml` via `prisma/seed.ts`.
