create table if not exists public.intake_submissions (
 id uuid primary key default gen_random_uuid(),
 submitted_at timestamptz not null default now(),
 intent text not null check (intent in ('propose_transport','propose_hebergement','cherche_transport','cherche_hebergement')),
 first_name text not null,
 last_name text not null,
 email text not null,
 phone text not null,
 city text not null,
 exact_address text,
 departure_date date,
 departure_time text,
 arrival_place text,
 adult_count smallint not null default 1 check (adult_count between 0 and 15),
 child_count smallint not null default 0 check (child_count between 0 and 15),
 seat_count smallint check (seat_count between 1 and 15),
 companions text,
 luggage text,
 accommodation_minutes smallint check (accommodation_minutes between 0 and 600),
 offer_reference text,
 notes text,
 status text not null default 'pending' check (status in ('pending','processed','discarded'))
);
alter table public.intake_submissions enable row level security;
revoke all on public.intake_submissions from anon, authenticated;
create index if not exists intake_submissions_pending_idx on public.intake_submissions(status, submitted_at);
