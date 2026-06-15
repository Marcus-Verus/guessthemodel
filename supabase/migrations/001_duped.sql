-- DUPED — minimal data layer for email signups + game events.
-- Run this in the Supabase SQL editor (or via the CLI) on your project.

create table if not exists signups (
	id bigint generated always as identity primary key,
	email text not null unique,
	created_at timestamptz not null default now()
);

create table if not exists events (
	id bigint generated always as identity primary key,
	type text not null,
	meta jsonb,
	created_at timestamptz not null default now()
);

create index if not exists events_type_created_idx on events (type, created_at desc);
create index if not exists signups_created_idx on signups (created_at desc);

-- All access is server-side via the service-role key, so keep RLS on with no
-- public policies (service role bypasses RLS).
alter table signups enable row level security;
alter table events enable row level security;
