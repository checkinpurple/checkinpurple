# CheckinPurple · Complete Feature Log & Backlog

> Last updated: May 2026 · Batch 5 — mock data removed everywhere, RolePreview component, blank login fix, user count fix.

---

## 📦 Zip File Reference (apply in order)

| Zip | Key changes | Files |
|-----|-------------|-------|
| `cp-ui-update.zip` | Sidebar, Dashboard, ArtistProfile, Influencer, Merchant, Index redesign | client/pages, client/components |
| `cp-fixes.zip` | /fan route fix, Wall route, public stats, payments.ts | client/App.tsx, server/ |
| `cp-todo-batch1.zip` | ArtistSettings socials+streaming+skills, Merchant gallery+categories, Store filters, FanStatus | client/pages, client/components |
| `cp-batch2.zip` | Wallet dual currency+live rate, Broadcast save+share, Listen share btn, ArtistCollabs, OGMeta, savedStreams server | client/, server/ |
| `cp-audit-fixes.zip` | Broadcast restored, Wallet restored, Listen restored, FanProfile full, InfluencerProfile full | client/ |
| `cp-batch4.zip` | ArtistProfile OGMeta+collabs+skills wired, ArtistSettings gallery upload, PastStreams page, Wall real API, savedStreams routes registered, payout email | client/, server/ |
| `cp-usercount-fix.zip` | Admin + homepage user count from auth (not profile table), No Profile badge | client/pages/Admin.tsx, server/ |
| `cp-blank-fix.zip` | **Login blank screen fixed** — auth-context loading always resolves, ProtectedRoute checks profiles[], Dashboard no longer returns null | client/ |
| `cp-batch5.zip` | **Mock data removed everywhere**, RolePreview component, Tiers+Dashboard wired | client/, server/ |

---

## ✅ Everything Shipped

### Bugs Fixed
- [x] **Blank page after login** — `fetchUserProfile` never called `setLoading(false)` in all branches; 8s safety timeout added; `ProtectedRoute` now checks `profiles[]` not just `user.role`
- [x] **User count wrong on admin + homepage** — was reading from `users` profile table; now reads from `supabase.auth.admin.listUsers()` (true registration count); "No Profile" badge shows users who registered but haven't completed setup
- [x] **Tier upgrade JSON error** — `manual-claim` endpoint handled missing table by crashing; now returns graceful response
- [x] **Profile selector stuck on Fan** — swaps on Basic tier instead of blocking
- [x] **Admin fan dashboard redirect** — removed `requiredRole="fan"` guard
- [x] **Livepeer stream key** — server uses `LIVEPEER_API_KEY` not `VITE_` prefixed

### Mock Data Removed (Batch 5)
- [x] **Wall** — `MOCK_POSTS` constant deleted; shows empty state when API returns no posts
- [x] **Wall server** — Unsplash thumbnail URLs replaced with real `avatar_url` or `undefined`
- [x] **ArtistProfile** — Unsplash gallery fallback removed; shows empty state when no uploads
- [x] **Influencer discover tab** — hardcoded tracks replaced with real `/api/streams/active` fetch
- [x] **Merchant discover tab** — hardcoded tracks replaced with real `/api/streams/active` fetch

### Role Preview (Batch 5)
- [x] **RolePreview component** — interactive profile explorer showing mock dashboard, feature list, and upgrade CTA for each role (Fan, Artist, Influencer, Merchant)
- [x] **Tiers page** — RolePreview wired below tier cards so users can explore before upgrading
- [x] **Dashboard** — RolePreview shown to single-profile users with "Explore other profiles" heading

### Layout & Navigation
- [x] Home page — decluttered hero, role chips, pricing, features grid, live user count
- [x] AppSidebar — desktop + mobile drawer, profile switcher, role-aware links
- [x] Dashboard — quick-action grid, stats row, Past Streams + Store + Wall cards
- [x] Wall — real API feed with filter pills (All / Live / Reels / Snippets / Promos / Drops)

### Artist
- [x] ArtistProfile — gallery tab (followers-only), lightbox, Offer to Dress, Propose Deal
- [x] ArtistProfile — OGMeta, skills chips, streaming links, Collabs tab
- [x] ArtistSettings — social links (Instagram, Twitter, TikTok, Facebook, YouTube, SoundCloud)
- [x] ArtistSettings — streaming links (Spotify, Apple Music, Audiomack, YouTube Music, Deezer)
- [x] ArtistSettings — Skills & Services selector (10 skill types)
- [x] ArtistSettings — Photo gallery upload to Supabase Storage `artist-gallery`
- [x] ArtistCollabs component — search, invite, accept/decline
- [x] Broadcast — track queue, save stream toggle, privacy selector, share link
- [x] PastStreams page — saved recordings with play/edit/delete/visibility

### Fan
- [x] FanStatus component — editable "currently listening to"
- [x] FanProfile page (`/fan/:username`) — About, Following Artists, Schedule tabs

### Influencer
- [x] Influencer dashboard — Promotions, Discover Music (real streams), Earnings tabs
- [x] InfluencerProfile page (`/influencer/:username`) — About, Active Promos, deal proposal modal

### Merchant
- [x] Merchant dashboard — Products, Orders, Gallery, Dressing Requests, Discover Music (real streams), Settings
- [x] Product categories: Merch, Digital, Ticket, Sample Pack, Plugin/VST, Software, Graphic Design
- [x] Currently Available toggle + availability note

### Store
- [x] Categories: Fashion, Digital, Tickets, Sample Packs, Plugins, Software, Design Services

### Wallet
- [x] Dual ZAR + USD on all balances and transactions
- [x] Live USD/ZAR rate from exchangerate-api.com
- [x] Minimum withdrawal banner (R200 / $11 clearly shown)
- [x] Payout email to admin via Resend on withdrawal request

### Listen
- [x] Stream cards with share button (Web Share API + clipboard fallback)
- [x] Follow/unfollow, tip with coins

### Admin
- [x] True user count from `auth.users`
- [x] "No Profile" badge for incomplete registrations
- [x] User table with role editor, ban/unban, impersonate

---

## 🔲 Remaining To-Do

### Quick
- [ ] **InfluencerSettings page** — influencer needs a settings page to enter their reach, platforms, and promotion rate. These fields power `/influencer/:username`. Route: `/influencer-settings`.
- [ ] **Wire `<FanStatus editable />`** into Fan Dashboard card directly (component exists, just needs dropping in).
- [ ] **Merchant gallery → Store listing** — show gallery photos on merchant's product section in Store.

### Medium
- [ ] **Booking availability calendar** — replace free-text booking note with date-picker slots in ArtistSettings.
- [ ] **Booking approval flow** — artist receives request, accepts/declines, fan gets notified.
- [ ] **Personalised playlists** — currently a stub; needs `playlists` table + real create/list/delete UI.
- [ ] **Wall auto-post on merchant available** — insert `wall_posts` row when `is_available` flips true.
- [ ] **Wall auto-post on influencer deal accepted** — insert `wall_posts` row when deal status → accepted.

---

## 📋 All SQL To Run in Supabase

```sql
-- Users table columns
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

-- Manual payments (Tier upgrade fix)
CREATE TABLE IF NOT EXISTS manual_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount text NOT NULL,
  tx_id text NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Payout requests (Wallet withdrawal)
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

-- Artist collaborators
CREATE TABLE IF NOT EXISTS artist_collaborators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid REFERENCES users(id) ON DELETE CASCADE,
  collaborator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, collaborator_id)
);

-- Saved streams
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

-- Fan availability
CREATE TABLE IF NOT EXISTS fan_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  days text[],
  note text,
  updated_at timestamptz DEFAULT now()
);

-- Influencer deals
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

-- Wall posts (auto-populated by streams, deals, merchant availability)
CREATE TABLE IF NOT EXISTS wall_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  caption text,
  media_url text,
  thumbnail_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Supabase Storage
-- Create bucket: artist-gallery (set to public)
```

---

*CheckinPurple · Music · Fashion · Live · South Africa*
