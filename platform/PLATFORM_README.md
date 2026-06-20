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

Members on different devices need a public URL. Permanently-free option (not the 1-hour
trials — that's Railway running out of credits):

**App on Vercel + database & PDF storage on Supabase — both free tiers, permanent.**

1. Push this repo to GitHub (already done on your branch).
2. **Supabase** (<https://supabase.com>, free): create a project. Copy the Postgres
   **connection string** (Project Settings ▸ Database) and create a **Storage bucket**
   for PDFs.
3. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
4. **Vercel** (<https://vercel.com>, free Hobby): "Import" the GitHub repo, set the root
   directory to `platform`, and add the env var `DATABASE_URL` = your Supabase string.
5. Run `npx prisma db push` against the Supabase DB, then `npm run seed`.
6. Deploy. Share the Vercel URL in LINE — opens on every device.

> **PDF storage note:** Vercel's filesystem is temporary, so for the deployed version the
> uploaded PDFs must live in object storage. Everything funnels through **one file**,
> `lib/storage.ts` — swap its `saveFile`/`readFile` bodies for **Supabase Storage**
> (free 1 GB) or **Cloudflare R2** (free 10 GB) and nothing else changes. The local build
> already works as-is. (Tell me when you're ready to deploy and I'll wire this up.)

---

## Tech
Next.js (App Router) · Prisma (SQLite local → Postgres for deploy) · Tailwind CSS.
Ranking logic lives in `lib/metrics.ts`; storage in `lib/storage.ts`; data model in
`prisma/schema.prisma`; seed reads `config.yaml` via `prisma/seed.ts`.
