update profiles
set email = lower(btrim(email)),
    id_number = btrim(id_number),
    first_name = nullif(btrim(first_name), ''),
    surname = nullif(btrim(surname), '');

alter table profiles
  add column if not exists auth_token_version integer not null default 0;

alter table profiles
  alter column id_number set not null;

alter table profiles
  drop constraint if exists profiles_email_canonical;

alter table profiles
  add constraint profiles_email_canonical check (email = lower(btrim(email)));

alter table profiles
  drop constraint if exists profiles_id_number_format;

alter table profiles
  add constraint profiles_id_number_format check (id_number ~ '^[0-9]{1,32}$');

create unique index if not exists idx_profiles_email_lower on profiles (lower(email));
create unique index if not exists idx_profiles_id_number on profiles (id_number);
create unique index if not exists idx_profiles_single_admin on profiles ((role)) where role = 'admin';