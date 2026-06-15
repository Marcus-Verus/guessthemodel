-- DUPED — data layer. Run this in the Supabase SQL editor on your project.
-- It removes the old GuessTheModel tables and creates DUPED's schema.

-- 1) Drop everything left over from GuessTheModel (safe if already gone).
drop table if exists votes cascade;
drop table if exists deck_plays cascade;
drop table if exists decks cascade;
drop table if exists battles cascade;
drop table if exists pool_items cascade;
drop table if exists survival_runs cascade;
drop table if exists email_signups cascade;

-- 2) Email signups.
create table if not exists signups (
	id bigint generated always as identity primary key,
	email text not null unique,
	created_at timestamptz not null default now()
);

-- 3) Game events (game_complete, endless_over, amazon_click, share, subscribe).
create table if not exists events (
	id bigint generated always as identity primary key,
	type text not null,
	meta jsonb,
	created_at timestamptz not null default now()
);

-- 4) The daily puzzle, stored once per day so everyone plays the same #N and
--    past/future days are kept. `day` = floor(epoch_ms / 86_400_000).
create table if not exists daily_puzzles (
	day integer primary key,
	category text not null,
	items jsonb not null,
	live boolean not null default false,
	created_at timestamptz not null default now()
);

create index if not exists events_type_created_idx on events (type, created_at desc);
create index if not exists signups_created_idx on signups (created_at desc);

-- All access is server-side via the service-role key (which bypasses RLS), so
-- keep RLS enabled with no public policies.
alter table signups enable row level security;
alter table events enable row level security;
alter table daily_puzzles enable row level security;
