alter table attempts
  add column if not exists review_flagged boolean not null default false,
  add column if not exists suspicion_score integer not null default 0,
  add column if not exists proctoring_summary jsonb not null default '{}'::jsonb;

alter table profiles
  add column if not exists next_test_eligible_at timestamptz,
  add column if not exists next_booking_eligible_at timestamptz,
  add column if not exists license_collection_from timestamptz;
