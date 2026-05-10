# Calloway — Personal Life OS

Your personal dashboard. Dark glassmorphism, warm earth tones, AWST timezone throughout.

## Stack
- React + Vite
- Framer Motion + GSAP (animations)
- Zustand (state, persisted to localStorage)
- Supabase (optional cloud sync)
- Recharts (charts)
- date-fns + date-fns-tz (AWST time)

---

## Quick Start

### 1. Install Node.js
Download LTS from [nodejs.org](https://nodejs.org)

### 2. Install dependencies
```bash
cd calloway
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` — you can leave Supabase blank for now; data saves to localStorage.

### 4. Run dev server
```bash
npm run dev
```
Opens at **http://localhost:5173**

---

## Supabase Setup (optional but recommended for sync)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Once created: **Settings → API** → copy Project URL and anon key
3. Paste into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```
4. Open **SQL Editor** in Supabase dashboard → paste contents of `schema.sql` → Run
5. Restart dev server (`npm run dev`)
6. Go to **Settings → Account** in Calloway → create an account or sign in

---

## Weather Widget

1. Get a free API key at [openweathermap.org](https://openweathermap.org/api)
2. Add to `.env.local`:
   ```
   VITE_OPENWEATHER_API_KEY=your_key_here
   ```
3. Restart dev server

---

## Deploy to Vercel

1. Push to GitHub: `git init && git add . && git commit -m "init" && git push`
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add the three environment variables in Vercel project settings
4. Deploy — Vercel auto-deploys on every push

---

## Modules

| Module | Features |
|--------|----------|
| Overview | Daily summary, stats, mood chart, finance snapshot, habits |
| Academics | Subjects, raw/scaled scores, ATAR estimator, what-if simulator, grade chart |
| Assignments | Due dates, status tracking, SAC/exam types, study session logger, streak |
| Athletics | Game results, W/L record, points, training sessions |
| Finance | Income/expense tracker, savings goals, spending by category, 6-month chart |
| Health | Sleep, water intake, workouts, mood, body metrics |
| Tasks | To-dos with priority/due dates, habit tracker (7-day grid + streaks), Pomodoro timer |
| Calendar | Monthly calendar, add events, upcoming list |
| Social | Contacts, important dates, gratitude journal |
| Goals | Life goals board, vision board, skill tracker, bucket list |
| Notes | Quick notes (coloured), bookmarks, quick-links launcher, weather |
| Settings | Profile, accent colour, Supabase auth, data export |

---

## Daily & Weekly Reflections (AWST)

- **Daily reflection** auto-prompts at **8:00 PM AWST** each night
- **Weekly review** auto-prompts on **Sunday at 7:00 PM AWST**
- Both can be manually triggered anytime from the sidebar buttons
- Saves to localStorage (and Supabase if connected)

---

## Palette

| Token | Hex |
|-------|-----|
| `--ink` | `#0b0b0f` |
| `--cream` | `#f2ede4` |
| `--dusk` | `#9b8fd4` |
| `--clay` | `#e0784a` |
| `--sage` | `#6dbf8a` |
| `--teal` | `#4ec9b8` |
| `--rose` | `#e8607a` |
| `--amber` | `#f0a24a` |
| `--sand` | `#d4b896` |
