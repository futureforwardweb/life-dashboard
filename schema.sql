-- ============================================================
-- CALLOWAY — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Helper: updated_at trigger ──
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── TASKS ──
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  priority text default 'medium',
  category text default 'Personal',
  due_date date,
  notes text,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger tasks_updated_at before update on tasks for each row execute function update_updated_at();
alter table tasks enable row level security;
create policy "user tasks" on tasks for all using (auth.uid() = user_id);

-- ── HABITS ──
create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  icon text default '✦',
  frequency text default 'daily',
  created_at timestamptz default now()
);
alter table habits enable row level security;
create policy "user habits" on habits for all using (auth.uid() = user_id);

create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  habit_id uuid references habits on delete cascade,
  date date not null,
  created_at timestamptz default now(),
  unique(habit_id, date)
);
alter table habit_logs enable row level security;
create policy "user habit_logs" on habit_logs for all using (auth.uid() = user_id);

-- ── GOALS ──
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  area text,
  description text,
  target_date date,
  progress integer default 0,
  color text,
  milestones text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger goals_updated_at before update on goals for each row execute function update_updated_at();
alter table goals enable row level security;
create policy "user goals" on goals for all using (auth.uid() = user_id);

-- ── EVENTS (Calendar) ──
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  date date not null,
  time time,
  category text,
  color text,
  notes text,
  created_at timestamptz default now()
);
alter table events enable row level security;
create policy "user events" on events for all using (auth.uid() = user_id);

-- ── TRANSACTIONS (Finance) ──
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  type text not null, -- 'income' | 'expense'
  amount numeric(10,2) not null,
  category text,
  description text,
  date date,
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "user transactions" on transactions for all using (auth.uid() = user_id);

-- ── SAVINGS GOALS ──
create table if not exists savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  emoji text,
  target numeric(10,2),
  current numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table savings_goals enable row level security;
create policy "user savings_goals" on savings_goals for all using (auth.uid() = user_id);

-- ── NOTES ──
create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text,
  content text,
  color text default 'default',
  tags text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger notes_updated_at before update on notes for each row execute function update_updated_at();
alter table notes enable row level security;
create policy "user notes" on notes for all using (auth.uid() = user_id);

-- ── BOOKMARKS ──
create table if not exists bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  url text not null,
  category text,
  notes text,
  created_at timestamptz default now()
);
alter table bookmarks enable row level security;
create policy "user bookmarks" on bookmarks for all using (auth.uid() = user_id);

-- ── QUICK LINKS ──
create table if not exists quick_links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  label text not null,
  url text not null,
  icon text default '🔗',
  created_at timestamptz default now()
);
alter table quick_links enable row level security;
create policy "user quick_links" on quick_links for all using (auth.uid() = user_id);

-- ── SLEEP LOGS ──
create table if not exists sleep_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  hours numeric(4,1),
  quality integer,
  bedtime time,
  wake_time time,
  created_at timestamptz default now()
);
alter table sleep_logs enable row level security;
create policy "user sleep_logs" on sleep_logs for all using (auth.uid() = user_id);

-- ── WATER LOGS ──
create table if not exists water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  ml integer not null,
  created_at timestamptz default now()
);
alter table water_logs enable row level security;
create policy "user water_logs" on water_logs for all using (auth.uid() = user_id);

-- ── WORKOUT LOGS ──
create table if not exists workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  type text,
  duration integer,
  notes text,
  created_at timestamptz default now()
);
alter table workout_logs enable row level security;
create policy "user workout_logs" on workout_logs for all using (auth.uid() = user_id);

-- ── MOOD LOGS ──
create table if not exists mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  mood integer,
  energy integer,
  notes text,
  created_at timestamptz default now()
);
alter table mood_logs enable row level security;
create policy "user mood_logs" on mood_logs for all using (auth.uid() = user_id);

-- ── BODY METRICS ──
create table if not exists body_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  weight numeric(5,1),
  notes text,
  created_at timestamptz default now()
);
alter table body_metrics enable row level security;
create policy "user body_metrics" on body_metrics for all using (auth.uid() = user_id);

-- ── SUBJECTS (Academics) ──
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  code text,
  teacher text,
  raw_score numeric(5,2),
  scaled_score numeric(5,2),
  sac_weight integer default 50,
  exam_weight integer default 50,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table subjects enable row level security;
create policy "user subjects" on subjects for all using (auth.uid() = user_id);

-- ── ASSIGNMENTS ──
create table if not exists assignments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  subject_id uuid references subjects on delete set null,
  due_date date,
  type text,
  priority text default 'normal',
  status text default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table assignments enable row level security;
create policy "user assignments" on assignments for all using (auth.uid() = user_id);

-- ── STUDY SESSIONS ──
create table if not exists study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  subject_id uuid references subjects on delete set null,
  duration integer,
  notes text,
  date timestamptz default now()
);
alter table study_sessions enable row level security;
create policy "user study_sessions" on study_sessions for all using (auth.uid() = user_id);

-- ── GAMES (Athletics) ──
create table if not exists games (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  opponent text,
  venue text,
  result text,
  points_for integer default 0,
  points_against integer default 0,
  notes text,
  created_at timestamptz default now()
);
alter table games enable row level security;
create policy "user games" on games for all using (auth.uid() = user_id);

-- ── TRAINING SESSIONS ──
create table if not exists training_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  type text,
  duration integer,
  notes text,
  created_at timestamptz default now()
);
alter table training_sessions enable row level security;
create policy "user training_sessions" on training_sessions for all using (auth.uid() = user_id);

-- ── CONTACTS ──
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  relationship text,
  birthday date,
  last_contact date,
  notes text,
  created_at timestamptz default now()
);
alter table contacts enable row level security;
create policy "user contacts" on contacts for all using (auth.uid() = user_id);

-- ── SOCIAL EVENTS ──
create table if not exists social_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  date date not null,
  type text,
  notes text,
  created_at timestamptz default now()
);
alter table social_events enable row level security;
create policy "user social_events" on social_events for all using (auth.uid() = user_id);

-- ── GRATITUDE ──
create table if not exists gratitude_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  text text not null,
  category text,
  date timestamptz default now()
);
alter table gratitude_entries enable row level security;
create policy "user gratitude_entries" on gratitude_entries for all using (auth.uid() = user_id);

-- ── DAILY REFLECTIONS ──
create table if not exists daily_reflections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date not null,
  highlight text,
  challenge text,
  learned text,
  grateful text,
  tomorrow text,
  mood integer,
  energy integer,
  created_at timestamptz default now()
);
alter table daily_reflections enable row level security;
create policy "user daily_reflections" on daily_reflections for all using (auth.uid() = user_id);

-- ── WEEKLY REFLECTIONS ──
create table if not exists weekly_reflections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  week_of date not null,
  wins text,
  challenges text,
  learned text,
  academic text,
  athletic text,
  health text,
  social text,
  next_week text,
  mood integer,
  created_at timestamptz default now()
);
alter table weekly_reflections enable row level security;
create policy "user weekly_reflections" on weekly_reflections for all using (auth.uid() = user_id);

-- ── VISION BOARD ──
create table if not exists vision_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  title text not null,
  image_url text,
  category text,
  description text,
  created_at timestamptz default now()
);
alter table vision_items enable row level security;
create policy "user vision_items" on vision_items for all using (auth.uid() = user_id);

-- ── SKILLS ──
create table if not exists skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  category text,
  level integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table skills enable row level security;
create policy "user skills" on skills for all using (auth.uid() = user_id);

-- ── BUCKET LIST ──
create table if not exists bucket_list (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  item text not null,
  completed boolean default false,
  created_at timestamptz default now()
);
alter table bucket_list enable row level security;
create policy "user bucket_list" on bucket_list for all using (auth.uid() = user_id);
