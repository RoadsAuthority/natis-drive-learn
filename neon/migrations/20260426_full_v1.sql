create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email))),
  password_hash text not null,
  auth_token_version integer not null default 0 check (auth_token_version >= 0),
  first_name text,
  surname text,
  id_number text not null check (id_number ~ '^[0-9]{1,32}$'),
  licence_code text,
  role text not null default 'candidate' check (role in ('candidate', 'admin')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  eye_test_status text not null default 'pending' check (eye_test_status in ('pending', 'passed', 'uploaded')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  id_copy_path text,
  passport_copy_path text,
  doctor_letter_path text,
  face_capture_path text,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  booking_date date not null,
  slot_time text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists question_bank (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  options_json jsonb not null,
  correct_answer text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  score integer not null,
  total integer not null,
  percentage numeric(5,2) not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'paypal',
  provider_order_id text,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_profiles_email_lower on profiles (lower(email));
create unique index if not exists idx_profiles_id_number on profiles (id_number);
create unique index if not exists idx_profiles_single_admin on profiles ((role)) where role = 'admin';
create index if not exists idx_bookings_profile_id on bookings(profile_id);
create index if not exists idx_attempts_profile_id on attempts(profile_id);
create index if not exists idx_payments_profile_id on payments(profile_id);
create index if not exists idx_verification_documents_profile_id on verification_documents(profile_id);

