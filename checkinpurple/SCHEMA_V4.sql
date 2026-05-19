-- ============================================
-- RAWCAST v4 SCHEMA ADDITIONS
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Extended artist profiles
alter table users add column if not exists artist_bio text;
alter table users add column if not exists genres text[]; -- e.g. ['Amapiano', 'House', 'Afrobeats']
alter table users add column if not exists is_dj boolean default false;
alter table users add column if not exists explicit_content boolean default false;
alter table users add column if not exists booking_available boolean default false;
alter table users add column if not exists booking_fee_coins integer; -- optional declared fee in coins
alter table users add column if not exists booking_fee_zar numeric; -- optional declared fee in ZAR
alter table users add column if not exists booking_fee_usd numeric;
alter table users add column if not exists booking_rate_type text default 'negotiable'
  check (booking_rate_type in ('per_hour', 'per_event', 'negotiable'));
alter table users add column if not exists booking_note text; -- e.g. "DM for corporate rates"
alter table users add column if not exists social_instagram text;
alter table users add column if not exists social_twitter text;
alter table users add column if not exists social_soundcloud text;

-- 2. Booking requests
create table if not exists booking_requests (
  id uuid default gen_random_uuid() primary key,
  fan_id uuid references users(id) on delete cascade,
  fan_username text not null,
  artist_id uuid references users(id) on delete cascade,
  artist_username text not null,
  event_type text not null check (event_type in ('dj_set', 'live_performance', 'feature', 'collab', 'private_event', 'corporate', 'other')),
  event_date timestamptz,
  event_location text,
  event_description text,
  expected_duration_hours numeric,
  offered_fee_coins integer,
  offered_fee_zar numeric,
  offered_fee_usd numeric,
  payment_method text check (payment_method in ('coins', 'cash_zar', 'cash_usd', 'negotiable')),
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'negotiating', 'confirmed', 'cancelled')),
  artist_response text,
  counter_fee_zar numeric,
  counter_fee_coins integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Gigs / concerts (artist posts)
create table if not exists gigs (
  id uuid default gen_random_uuid() primary key,
  artist_id uuid references users(id) on delete cascade,
  artist_username text not null,
  artist_avatar text,
  title text not null,
  description text,
  venue text not null,
  city text not null,
  country text default 'South Africa',
  event_date timestamptz not null,
  doors_open timestamptz,
  ticket_price_zar numeric,
  ticket_price_usd numeric,
  ticket_url text,
  is_free boolean default false,
  cover_url text,
  genres text[],
  explicit_content boolean default false,
  max_capacity integer,
  status text default 'upcoming' check (status in ('upcoming', 'live', 'ended', 'cancelled')),
  rsvp_count integer default 0,
  created_at timestamptz default now()
);

-- 4. Gig RSVPs (fans mark interested)
create table if not exists gig_rsvps (
  id uuid default gen_random_uuid() primary key,
  gig_id uuid references gigs(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now(),
  unique(gig_id, user_id)
);

-- 5. Notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  type text not null check (type in (
    'booking_request', 'booking_accepted', 'booking_declined',
    'booking_counter', 'booking_confirmed',
    'new_gig', 'gig_reminder', 'gig_cancelled',
    'new_follower', 'coin_tip', 'submission_approved',
    'submission_rejected', 'collab_invite', 'rsvp_confirmed',
    'system'
  )),
  title text not null,
  message text not null,
  read boolean default false,
  action_url text, -- where to navigate on click
  data jsonb,      -- extra metadata
  created_at timestamptz default now()
);

-- 6. Booking messages (in-booking chat)
create table if not exists booking_messages (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references booking_requests(id) on delete cascade,
  sender_id uuid references users(id),
  sender_username text,
  message text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_bookings_artist on booking_requests(artist_id);
create index if not exists idx_bookings_fan on booking_requests(fan_id);
create index if not exists idx_bookings_status on booking_requests(status);
create index if not exists idx_gigs_artist on gigs(artist_id);
create index if not exists idx_gigs_date on gigs(event_date);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_read on notifications(user_id, read);

-- RLS
alter table booking_requests enable row level security;
alter table gigs enable row level security;
alter table notifications enable row level security;
alter table booking_messages enable row level security;

create policy "Bookings visible to parties" on booking_requests
  for select using (auth.uid() = fan_id or auth.uid() = artist_id);
create policy "Gigs are public" on gigs for select using (true);
create policy "Notifications are private" on notifications
  for select using (auth.uid() = user_id);
create policy "Booking messages visible to parties" on booking_messages
  for select using (
    exists (
      select 1 from booking_requests b
      where b.id = booking_id
      and (b.fan_id = auth.uid() or b.artist_id = auth.uid())
    )
  );
