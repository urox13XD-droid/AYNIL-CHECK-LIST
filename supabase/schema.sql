-- AYNIL Check List — shared session storage
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is idempotent.
--
-- Can be run in the SAME Supabase project already used for AYNIL Condition
-- Report — this just adds one more table alongside condition_sessions.

create table if not exists checklist_sessions (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 days')
);

alter table checklist_sessions enable row level security;

-- No login system in this app: knowing (or guessing) the session name is what
-- grants access, the same trust model as a shared document link. Anyone with
-- the public anon key can read/write any session row.
drop policy if exists "anon can read checklist sessions" on checklist_sessions;
create policy "anon can read checklist sessions" on checklist_sessions
  for select to anon using (true);

drop policy if exists "anon can insert checklist sessions" on checklist_sessions;
create policy "anon can insert checklist sessions" on checklist_sessions
  for insert to anon with check (true);

drop policy if exists "anon can update checklist sessions" on checklist_sessions;
create policy "anon can update checklist sessions" on checklist_sessions
  for update to anon using (true) with check (true);

-- keep updated_at / expires_at fresh automatically on every write, so the
-- client only ever has to send `id` and `data`
create or replace function touch_checklist_session()
returns trigger as $$
begin
  new.updated_at := now();
  new.expires_at := now() + interval '60 days';
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_checklist_session on checklist_sessions;
create trigger trg_touch_checklist_session
  before insert or update on checklist_sessions
  for each row execute function touch_checklist_session();

-- realtime: broadcast row changes to subscribed clients
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'checklist_sessions'
  ) then
    alter publication supabase_realtime add table checklist_sessions;
  end if;
end $$;

-- daily purge of sessions inactive for 60+ days
create extension if not exists pg_cron with schema extensions;

select cron.unschedule('purge-expired-checklist-sessions')
where exists (select 1 from cron.job where jobname = 'purge-expired-checklist-sessions');

select cron.schedule(
  'purge-expired-checklist-sessions',
  '23 3 * * *', -- 03:23 UTC daily
  $$ delete from checklist_sessions where expires_at < now(); $$
);
