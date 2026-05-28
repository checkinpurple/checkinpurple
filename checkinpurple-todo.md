# CheckinPurple · Complete Feature Log & Backlog

> Last updated: May 2026

---

## 🐛 Bug Just Fixed — User Count

**Problem:** Admin dashboard and homepage showed user count from the `users` profile table only. Users who registered via Supabase Auth but hadn't yet completed their profile weren't counted.

**Fix (cp-usercount-fix.zip):**
- `server/routes/admin.ts` — `listUsers` now calls `supabase.auth.admin.listUsers()` to get every registered account, then merges profile data where it exists. Users without a profile row show a yellow "No Profile" badge in the admin table.
- `server/index.ts` — `/api/public/stats` now reads from `auth.admin.listUsers` with a fallback to the profile table count.
- `client/pages/Admin.tsx` — reads the `total` field from the updated API so the stat card shows the true registration count.

**Files:**
```
cp-usercount-fix/client/pages/Admin.tsx        → client/pages/Admin.tsx
cp-usercount-fix/server/index.ts               → server/index.ts
cp-usercount-fix/server/routes/admin.ts        → server/routes/admin.ts
```

---

## ✅ Everything Shipped (Full History)

### Foundation — Initial Build
- [x] Project moved from subfolder (`checkinpurple/checkinpurple`) to root directory
- [x] Two GitHub branches merged into single `main`
- [x] Vercel root directory setting updated
- [x] Livepeer API key env var fixed — server uses `LIVEPEER_API_KEY` (no VITE_ prefix needed server-side)
- [x] Profile selector stuck on Fan — fixed to swap instead of block on Basic tier
- [x] Admin seed script fixed — uses `supabase.auth.admin.listUsers()` not raw table query
- [x] Admin fan dashboard redirect fixed — removed `requiredRole="fan"` guard so admin can access `/fan`
- [x] Tier upgrade JSON error fixed — `manual-claim` endpoint now handles missing table gracefully

### Layout & Navigation
- [x] Home page — decluttered hero, profile role cards, pricing section, features grid
- [x] AppSidebar — fixed desktop sidebar + mobile slide-out drawer across all dashboards
- [x] AppSidebar — profile switcher (fan/artist/merchant/influencer chips)
- [x] AppSidebar — shows Wall, Past Streams, Store, Bookings, Buy Coins links per role
- [x] Dashboard — grid of quick-action cards, stats row, upgrade banner
- [x] Dashboard — Store card visible to all profiles
- [x] Dashboard — Past Streams card for artists

### Wall / Feed
- [x] Wall page (`/wall`) — Facebook/X-style timeline
- [x] Wall — post types: Live Stream, Reel, Song Snippet, Influencer Promo, Merchant Catalogue
- [x] Wall — filter pills: All / Live / Reels / Snippets / Promos / Drops
- [x] Wall — share button, like button, comment count on each post
- [x] Wall — Merchant catalogue cards with horizontal scroll product strip
- [x] Wall — real API (`/api/wall/feed`) with mock fallback when DB is empty
- [x] Wall — linked from sidebar for all profiles

### Artist
- [x] ArtistProfile — photo gallery tab with lightbox (fullscreen image viewer)
- [x] ArtistProfile — gallery is followers-only (shows "Follow to view" if not following)
- [x] ArtistProfile — Merchant "Offer to Dress" button
- [x] ArtistProfile — Influencer "Propose Deal" button (commission note: from artist, not CheckinPurple)
- [x] ArtistProfile — OGMeta wired (WhatsApp/Twitter/iMessage rich link preview)
- [x] ArtistProfile — Skills rendered as chips in About tab
- [x] ArtistProfile — Streaming links (Spotify, Apple Music, Audiomack, YouTube Music, Deezer)
- [x] ArtistProfile — Collabs tab with ArtistCollabs component
- [x] ArtistProfile — Booking tab with date + message form
- [x] ArtistSettings — all social links: Instagram, Twitter, TikTok, Facebook, YouTube, SoundCloud
- [x] ArtistSettings — music streaming links: Spotify, Apple Music, Audiomack, YouTube Music, Deezer
- [x] ArtistSettings — Skills & Services selector (Sound Engineer, Podcast Host, Graphic Designer, Producer, Session Musician, Vocalist, Mixing & Mastering, Videographer, Photographer, Beat Maker)
- [x] ArtistSettings — Photo gallery upload to Supabase Storage `artist-gallery` bucket
- [x] ArtistCollabs component — search artists, send invites, accept/decline, display collab chips
- [x] Broadcast — full streaming page with track queue, audio controls
- [x] Broadcast — "Save this stream" toggle (sends `record: true` to Livepeer)
- [x] Broadcast — stream privacy selector (Public / Followers Only / Private)
- [x] Broadcast — share link auto-generated when stream goes live
- [x] PastStreams page (`/past-streams`) — saved recordings library with play, edit title, change visibility, delete
- [x] savedStreams.ts — server CRUD routes for saved recordings (GET/POST/PATCH/DELETE)
- [x] savedStreams routes registered in `server/index.ts`

### Fan
- [x] FanStatus component — "currently listening to" editable status, shown on profile and wall
- [x] FanProfile page (`/fan/:username`) — About tab, Following Artists tab, Schedule tab
- [x] FanProfile — follow/unfollow button
- [x] FanProfile — OGMeta for link previews
- [x] FanProfile — FanAvailabilityEditor (set available days + note)

### Influencer
- [x] Influencer dashboard — Promotions tab, Discover Music tab, Earnings tab
- [x] Influencer dashboard — referral link generator
- [x] InfluencerProfile page (`/influencer/:username`) — About tab, Active Promos tab
- [x] InfluencerProfile — "Propose Deal" modal for artists (commission from artist earnings, not CheckinPurple)
- [x] InfluencerProfile — OGMeta for link previews
- [x] InfluencerProfile — follow button

### Merchant
- [x] Merchant dashboard — Products tab, Orders tab, Gallery tab, Dressing Requests tab, Discover Music tab, Settings tab
- [x] Merchant — product categories expanded: Merch/Fashion, Digital, Ticket, Sample Pack, Plugin/VST, Software, Graphic Design Service
- [x] Merchant — photo gallery tab (upload press/catalogue shots)
- [x] Merchant — "Currently Available" toggle + availability note shown on wall
- [x] Merchant — Dressing Requests: accept/decline styling offers from artists
- [x] Merchant — Discover Music tab (find artists to dress/collaborate with)

### Store
- [x] Store page — filter categories expanded: Fashion, Digital, Tickets, Sample Packs, Plugins, Software, Design Services
- [x] Store — accessible from sidebar for all profiles

### Wallet
- [x] Wallet — dual currency display: ZAR and USD on every balance and transaction
- [x] Wallet — live USD/ZAR exchange rate from exchangerate-api.com (fallback to R18.50)
- [x] Wallet — minimum withdrawal info banner (R200 / $11) prominently shown
- [x] Wallet — payout email to admin via Resend when withdrawal requested
- [x] Wallet — ZAR / USD toggle on withdrawal form
- [x] Wallet — PayPal and Bank Transfer payout methods

### Listen
- [x] Listen page — stream cards with cover, artist, genre, listener count
- [x] Listen — share button per stream (Web Share API + clipboard fallback)
- [x] Listen — follow/unfollow artist from stream card
- [x] Listen — tip artist with coins from stream view

### Admin
- [x] Admin — user count now reads from `auth.users` (true registration count)
- [x] Admin — "No Profile" badge on users who registered but haven't set up profile
- [x] Admin — user table with role editor, ban/unban, view-as
- [x] Admin — streams, gigs, listening parties, payout requests tabs
- [x] Admin — email seeded to `checkinpurple@gmail.com` with correct SQL

### Payments & Subscriptions
- [x] Manual payments table fix (`manual_payments` insert handles missing table)
- [x] Payout request inserted to `payout_requests` table on withdrawal
- [x] Resend email to admin on every payout request

### Shared Components
- [x] OGMeta component — sets og:title, og:description, og:image, twitter:card
- [x] ArtistCollabs — collab invite/accept/decline with search
- [x] FanStatus — editable "currently listening to" with Supabase persistence
- [x] Chat component — live chat during streams
- [x] ProfileCard — editable avatar, bio, location, website

---

## 🔲 Remaining To-Do

### Quick (small lift)
- [ ] **InfluencerSettings page** — influencer needs their own settings page (like ArtistSettings) to enter reach, platforms, and promotion rate. These fields currently don't exist in settings; they power the public `/influencer/:username` profile page.
- [ ] **Wire `<FanStatus editable />` in Fan Dashboard** — component exists, just needs to be added to the fan dashboard card so fans see it from their home screen.
- [ ] **Merchant gallery → Store listing** — when a merchant has `gallery_images`, show a photo strip on their product cards in the public Store page.

### Medium
- [ ] **Booking availability calendar** — replace free-text booking note in ArtistSettings with a date-picker where artist marks available slots. Fan picks a slot in the booking form on ArtistProfile.
- [ ] **Personalised playlists** — artist creates a named playlist tagged to a specific fan or group. Fan sees it after following. Needs `playlists` table and builder UI.
- [ ] **Wall auto-post on stream start** — in `createStream` server handler, also insert a `wall_posts` row of type `stream` so the stream card appears on the Wall automatically.
- [ ] **Wall auto-post when merchant goes available** — insert `wall_posts` row when `is_available` flips true.
- [ ] **Wall auto-post when influencer deal accepted** — insert `wall_posts` row when deal status changes to `accepted`.

### Harder (backend)
- [ ] **Booking approval flow** — artist receives booking request notification, can accept/decline, fan gets notified. Currently requests are stored but not actioned.

---

## 📋 All SQL To Run in Supabase

```sql
-- ── Column additions ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS listening_to text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS listening_artist text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_live_listener boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS streaming_spotify text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streaming_apple text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streaming_audiomack text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streaming_youtube_music text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streaming_deezer text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_tiktok text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_facebook text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_youtube text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability_note text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gallery_images text[];

-- ── New tables ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manual_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount text NOT NULL,
  tx_id text NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  method text,
  currency text DEFAULT 'ZAR',
  amount numeric,
  coins int,
  paypal_email text,
  bank_name text,
  account_number text,
  branch_code text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artist_collaborators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid REFERENCES users(id) ON DELETE CASCADE,
  collaborator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, collaborator_id)
);

CREATE TABLE IF NOT EXISTS saved_streams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  livepeer_playback_id text,
  title text,
  duration_seconds int,
  visibility text DEFAULT 'public',
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fan_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  days text[],
  note text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS influencer_deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid REFERENCES users(id) ON DELETE CASCADE,
  artist_username text,
  influencer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  track_title text,
  commission_offer text,
  note text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ── Supabase Storage ──────────────────────────────────────────
-- In Storage tab (not SQL editor):
-- Create bucket: artist-gallery
-- Set to public so gallery images render on profiles
```

---

## 📦 Zip File Reference

| Zip | What's in it |
|-----|-------------|
| `cp-batch1.zip` | ArtistSettings (socials+streaming+skills), Merchant (gallery+categories+availability), Store (expanded filters), FanStatus component |
| `cp-batch2.zip` | Wallet (dual currency+live rate), Broadcast (save+share), Listen (share button), ArtistCollabs component, OGMeta component, savedStreams.ts server routes |
| `cp-batch3.zip` | FanProfile page, InfluencerProfile page (partial — use audit-fixes version) |
| `cp-audit-fixes.zip` | Broadcast.tsx restored, Wallet.tsx restored, Listen.tsx restored, FanProfile.tsx full, InfluencerProfile.tsx full |
| `cp-fixes.zip` | App.tsx (/fan fix + Wall route), Index.tsx (user count), Wall.tsx, AppSidebar.tsx, server/index.ts (public stats), server/routes/payments.ts |
| `cp-todo-batch1.zip` | ArtistSettings, Merchant, Store, FanStatus component |
| `cp-ui-update.zip` | Index.tsx, Dashboard.tsx, ArtistProfile.tsx, Influencer.tsx, Merchant.tsx, AppSidebar.tsx |
| `cp-batch4.zip` | ArtistProfile (OGMeta+collabs+skills+streaming wired), ArtistSettings (gallery upload), Dashboard (past streams card), PastStreams.tsx, Wall.tsx (real API), server/index.ts (savedStreams routes), server/routes/subscriptions.ts (payout email), App.tsx |
| `cp-usercount-fix.zip` | Admin.tsx (true auth count + no-profile badge), server/index.ts (auth count), server/routes/admin.ts (listUsers from auth) |

---

*CheckinPurple · Music · Fashion · Live · South Africa*
