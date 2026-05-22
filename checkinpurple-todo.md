# CheckinPurple · Feature Backlog

> Last updated: May 2026 · Batch 2 (Wallet dual currency, stream save/share, artist collabs, OG meta) shipped.

---

## ⚡ Quick Wins — Next Up

### 🎤 Artist Profile Page
- [ ] **Collabs on public profile** — wire `<ArtistCollabs viewUserId={artist.id} />` into ArtistProfile's About tab. Component already built in Batch 2.
- [ ] **OG meta on ArtistProfile** — drop `<OGMeta title={...} description={...} image={artist.avatar_url} />` at top of ArtistProfile. Component already built.
- [x] **Skills displayed on profile** — render `artist.skills` array as icon chips (data saved, just needs UI).
- [x] **Streaming links on profile** — show Spotify/Apple Music/Audiomack as icon buttons under artist name.

### 👨‍👩‍👧 Fan Public Profile
- [x] **`/fan/:username` route** — public fan profile page: display name, bio, artists they follow, FanStatus. Route in App.tsx.
- [x] **Fan status on Dashboard** — wire `<FanStatus editable />` into Fan Dashboard. DB column already added.

### 📢 Influencer
- [x] **`/influencer/:username` public profile** — page showing reach, platforms, active promotions, and "Propose Deal" button.

### 💳 Wallet
- [x] **Coin fraud/risk events tracking** — added `coin_risk_events` table + server logging for high-risk coin actions.
- [ ] **Payout email to admin** — on withdrawal POST, send Resend email to `checkinpurple@gmail.com`: `New payout request from @username — R{amount}`.

---

## 🟡 Medium Priority

### 🎤 Artist
- [x] **Photo gallery — followers only gate** — check `isFollowing` before rendering gallery; show "Follow to view" if not.
- [ ] **Gallery upload in ArtistSettings** — Supabase Storage bucket `artist-gallery`, store URLs in `gallery_images text[]` on users.
- [x] **Personalised playlists** — artist tags a playlist to a specific fan/group. Fan sees it after following.
- [ ] **Booking availability calendar** — date-picker instead of free-text; artist marks slots, fan selects when booking.
- [ ] **Saved streams library tab** — "Past Streams" tab on Artist Dashboard. Route and server handler already built (`savedStreams.ts`).

### 🛍️ Merchant
- [ ] **Gallery photos in Store** — merchant gallery should appear in public Store listing.
- [ ] **Merchant availability → Wall** — auto-post catalogue card to Wall when merchant toggles available.

### 📢 Influencer
- [ ] **Active promotions → Wall** — auto-post promo card to Wall when influencer deal is accepted.

---

## 🔴 Harder / Backend

### 🌐 Wall / Feed Real API
- [x] **`/api/wall/feed` endpoint** — aggregate streams, snippets, promos, merch drops, gigs. Paginate with cursor. `Wall.tsx` ready and waiting.
- [x] **Wall post on stream start** — `POST /api/streams` should auto-insert a wall post of type `stream`.
- [ ] **Wall post on merchant availability** — insert wall post when `is_available` flips to `true`.

---

## 📋 SQL to Run in Supabase

```sql
-- Batch 1 columns
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
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'ZAR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gallery_images text[];

-- Manual payments (fixes Tier upgrade error)
CREATE TABLE IF NOT EXISTS manual_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount text NOT NULL,
  tx_id text NOT NULL,
  notes text,
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
```

**Register saved stream routes in `server/index.ts`:**
```ts
import { getSavedStreams, saveStream, updateSavedStream, deleteSavedStream, getPublicSavedStreams } from "./routes/savedStreams";
app.get("/api/streams/saved", getSavedStreams);
app.post("/api/streams/saved", saveStream);
app.patch("/api/streams/saved/:id", updateSavedStream);
app.delete("/api/streams/saved/:id", deleteSavedStream);
app.get("/api/streams/saved/public/:userId", getPublicSavedStreams);
```

---

## ✅ Already Done

### Batch 2
- [x] Wallet — dual currency display (ZAR + USD) on all balances and transaction history
- [x] Wallet — live USD/ZAR exchange rate from exchangerate-api.com (graceful fallback)
- [x] Wallet — minimum withdrawal prominently shown with full payout info banner
- [x] Broadcast — "Save this stream" toggle with Public/Followers/Private privacy
- [x] Broadcast — share link auto-generated and copyable when stream goes live
- [x] Listen — Share button on every stream card (Web Share API + clipboard fallback)
- [x] ArtistCollabs component — search, invite, accept/decline, display collab chips
- [x] OGMeta component — og:title, og:description, og:image, twitter:card for WhatsApp/Twitter
- [x] savedStreams.ts — full CRUD server routes with follower visibility gating

### Batch 1
- [x] Artist Settings — TikTok, Facebook, YouTube, SoundCloud social links
- [x] Artist Settings — Spotify, Apple Music, Audiomack, YouTube Music, Deezer links
- [x] Artist Settings — Skills (Sound Engineer, Podcast Host, Graphic Designer, etc.)
- [x] Merchant — gallery tab, sample packs/plugins/software/design categories
- [x] Merchant — "Currently Available" toggle + note
- [x] Store — Sample Packs, Plugins, Software, Design Services filters
- [x] FanStatus component — editable "currently listening to" status

### Foundation
- [x] Sidebar navigation (Desktop + Mobile) — all dashboards
- [x] Home page decluttered + live user count
- [x] Artist gallery tab on public profile
- [x] Merchant "Offer to Dress" + Influencer "Propose Deal" on ArtistProfile
- [x] Wall / Feed — Reels, Snippets, Promos, Merchant catalogue, filter pills
- [x] Admin fan dashboard redirect fixed
- [x] Tier upgrade JSON error fixed
- [x] Livepeer API key env var fixed
- [x] Profile selector stuck on Fan — fixed
- [x] Admin seed script fixed
- [x] Project moved to root, branches merged to main

---

*CheckinPurple · Music · Fashion · Live*
