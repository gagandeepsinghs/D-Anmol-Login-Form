create table if not exists public.registrations (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  course_date date,
  phone text not null,
  email text not null,
  address text,
  course text not null,
  program text not null,
  duration text,
  education text,
  message text,
  consent boolean not null check (consent = true)
);

alter table public.registrations enable row level security;

revoke all on table public.registrations from anon, authenticated;
grant insert on table public.registrations to anon;

drop policy if exists "Allow public registration submissions" on public.registrations;
create policy "Allow public registration submissions"
on public.registrations
for insert
to anon
with check (consent = true);
