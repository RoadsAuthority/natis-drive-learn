create table if not exists test_session_violations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  session_started_at timestamptz not null,
  violation_type text not null check (violation_type in (
    'tab_switch',
    'window_blur',
    'fullscreen_exit',
    'copy',
    'cut',
    'paste',
    'context_menu'
  )),
  question_number integer not null check (question_number > 0),
  created_at timestamptz not null default now()
);

create index if not exists test_session_violations_profile_session_idx
  on test_session_violations (profile_id, session_started_at, created_at);