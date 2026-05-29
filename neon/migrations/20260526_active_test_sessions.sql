create table if not exists active_test_sessions (
  profile_id uuid primary key references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  current_question int not null default 1,
  total_questions int not null default 70,
  answered_count int not null default 0,
  tab_switches int not null default 0,
  face_missing_events int not null default 0,
  latest_snapshot_data text
);

create index if not exists active_test_sessions_last_heartbeat_idx
  on active_test_sessions (last_heartbeat_at desc);
