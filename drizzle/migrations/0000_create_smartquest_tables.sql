-- SmartQuest: weekly adventure-journey tables

create table public.sq_weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  title text not null,
  status text not null default 'active', -- active | done | carried | removed
  created_at timestamptz not null default now()
);

create table public.sq_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  goal_id uuid not null references public.sq_weekly_goals(id) on delete cascade,
  title text not null,
  minutes int not null default 30,
  day int, -- 0..6 where 0 = Saturday
  slot text, -- morning | afternoon | evening
  position int not null default 0,
  status text not null default 'pending', -- pending | done | skipped
  week_start date not null,
  created_at timestamptz not null default now()
);

create table public.sq_thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  dump_id uuid not null,
  raw text not null,
  title text not null,
  category text not null, -- school | quick | fixed | personal | wish | clutter
  link text,
  suggestion text not null, -- this_week | later | thought | fixed_event | personal_time | optional
  chosen text,
  created_at timestamptz not null default now()
);

create table public.sq_protected_time (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  days text not null default 'all', -- 'all' | comma-separated day numbers 0..6 (0 = Saturday)
  start_time text not null,
  end_time text not null,
  created_at timestamptz not null default now()
);

create table public.sq_life_prefs (
  user_id uuid primary key,
  sleep_start text not null default '23:00',
  sleep_end text not null default '07:00',
  school_start text not null default '08:00',
  school_end text not null default '15:00',
  study_days text not null default '0,1,2,3,4',
  learned jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.sq_energy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day date not null,
  level text not null, -- light | normal | high
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

create table public.sq_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index idx_sq_goals_user_week on public.sq_weekly_goals (user_id, week_start);
create index idx_sq_quests_user_week on public.sq_quests (user_id, week_start);
create index idx_sq_thoughts_user on public.sq_thoughts (user_id, dump_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_weekly_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_quests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_thoughts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_protected_time TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_life_prefs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_energy TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sq_journeys TO authenticated;
GRANT ALL ON public.sq_weekly_goals, public.sq_quests, public.sq_thoughts, public.sq_protected_time, public.sq_life_prefs, public.sq_energy, public.sq_journeys TO service_role;

-- RLS
alter table public.sq_weekly_goals enable row level security;
alter table public.sq_quests enable row level security;
alter table public.sq_thoughts enable row level security;
alter table public.sq_protected_time enable row level security;
alter table public.sq_life_prefs enable row level security;
alter table public.sq_energy enable row level security;
alter table public.sq_journeys enable row level security;

create policy "sq_goals_own" on public.sq_weekly_goals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sq_quests_own" on public.sq_quests for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sq_thoughts_own" on public.sq_thoughts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sq_protected_own" on public.sq_protected_time for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sq_prefs_own" on public.sq_life_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sq_energy_own" on public.sq_energy for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sq_journeys_own" on public.sq_journeys for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
