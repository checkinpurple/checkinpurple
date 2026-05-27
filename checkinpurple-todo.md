# CheckinPurple · Feature Backlog

> Last updated: May 2026 · Audit fixes shipped — Broadcast, Wallet, Listen, FanProfile, InfluencerProfile all restored and upgraded.

---

## ✅ Audit Findings & Status

| File | Was | Now |
|------|-----|-----|
| `Broadcast.tsx` | Stub (78 lines) — lost all streaming logic | ✅ Fully restored (495 lines) with save stream, share link, sidebar |
| `Wallet.tsx` | Stub (66 lines) — lost payout UI | ✅ Fully restored (334 lines) with dual currency + live ZAR/USD rate |
| `Listen.tsx` | Stub (58 lines) — lost stream cards | ✅ Fully restored (381 lines) with share button per stream |
| `FanProfile.tsx` | Minimal (106 lines) — no tabs, no follow, no schedule | ✅ Full page (345 lines) with About/Following/Schedule tabs |
| `InfluencerProfile.tsx` | Minimal (80 lines) — no deals, no promos | ✅ Full page (321 lines) with deal modal, active promos tab |
| `ArtistSettings.tsx` | ✅ Good — streaming links, skills, socials all in | No change needed |
| `Merchant.tsx` | ✅ Good — gallery tab, new categories, availability | No change needed |
| `Store.tsx` | ✅ Good — expanded categories | No change needed |
| `Dashboard.tsx` | ✅ Good — sidebar, store card, wall card | No change needed |
| `Wall.tsx` | ✅ Good — full feed with reels/snippets/promos/catalogue | No change needed |
| `Index.tsx` | ✅ Good — user count, hero, pricing | No change needed |
| `AppSidebar.tsx` | ✅ Good — Wall link, profile switcher, mobile drawer | No change needed |
| `ArtistProfile.tsx` | ✅ Good — gallery tab, skills, streaming links, merchant/influencer buttons | No change needed |
| `ArtistCollabs.tsx` | ✅ Good | No change needed |
| `FanStatus.tsx` | ✅ Good | No change needed |
| `OGMeta.tsx` | ✅ Good | No change needed |
| `savedStreams.ts` | ✅ Good | No change needed |
| `payments.ts` | ✅ Good — manual-claim fixed | No change needed |

---

## ⚡ Quick Wins — Next Up

### 🎤 Artist Profile — Wire Components
- [ ] **`<ArtistCollabs viewUserId={artist.id} />`** — add to ArtistProfile About tab to show "Works with" chips. Component is built, just needs wiring.
- [ ] **`<OGMeta />`** — add to top of ArtistProfile: `<OGMeta title={artist.username} description={artist.artist_bio} image={artist.avatar_url} />`. Component built, not yet wired.
- [ ] **`<OGMeta />`** — also wire into FanProfile and InfluencerProfile (already imported in both new pages).

### 🎤 Artist — Saved Streams Library
- [ ] **"Past Streams" tab on Artist Dashboard** — fetch from `GET /api/streams/saved` and render saved stream cards with title, date, playback link, visibility badge. Server route already built (`savedStreams.ts`).
- [ ] **Register savedStreams routes in `server/index.ts`**:
  ```ts
  import { getSavedStreams, saveStream, updateSavedStream, deleteSavedStream, getPublicSavedStreams } from "./routes/savedStreams";
  app.get("/api/streams/saved", getSavedStreams);
  app.post("/api/streams/saved", saveStream);
  app.patch("/api/streams/saved/:id", updateSavedStream);
  app.delete("/api/streams/saved/:id", deleteSavedStream);
  app.get("/api/streams/saved/public/:userId", getPublicSavedStreams);
  ```

### 💳 Wallet — Payout Email
- [ ] **Notify admin on withdrawal** — in `server/routes/payments.ts`, after `createPaymentMethod` inserts, send Resend email to `checkinpurple@gmail.com`:
  Subject: `New payout request from @{username} — R{amount}`

### 👨‍👩‍👧 Fan Dashboard
- [ ] **Wire `<FanStatus editable />`** into the Fan Dashboard so fans can update what they're listening to directly from their home screen.

---

## 🟡 Medium Priority

### 🎤 Artist
- [ ] **Gallery — followers-only gate** — ArtistProfile Gallery tab currently shows all images to everyone. Check `isFollowing` before rendering; show "Follow to view gallery" if not following.
- [ ] **Gallery upload** — add photo upload in ArtistSettings using Supabase Storage `artist-gallery` bucket. Store URLs in `gallery_images text[]` on `users`.
- [ ] **Personalised playlists** — artist tags a named playlist to a specific fan/group. Fan sees it after following.
- [ ] **Booking availability calendar** — swap free-text booking note for a proper date-picker with slots.

### 🛍️ Merchant
- [ ] **Gallery → Store** — merchant gallery photos should render in the public Store product listing.
- [ ] **Merchant availability → Wall** — auto-post catalogue card when merchant sets `is_available = true`.

### 📢 Influencer
- [ ] **Active promotions → Wall** — auto-post promo card when influencer deal is accepted.

---

## 🔴 Harder / Backend

### 🌐 Wall — Real API
- [ ] **`/api/wall/feed` real data** — `wall.ts` route exists. Replace mock with a real aggregation query: JOIN streams (live), snippets, influencer_deals (accepted), store products (available), gigs. Paginate by cursor.
- [ ] **Wall post on stream start** — in `POST /api/streams`, also insert a wall_post row of type `stream`.
- [ ] **Wall post on merchant availability** — when `is_available` flips `true`, insert a wall_post row of type `catalogue`.

---

## 📋 SQL Still Needed

```sql
-- Run these in Supabase SQL Editor if not yet done

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
```

---

## ✅ Everything Done So Far

### Audit Fixes (this release)
- [x] Broadcast.tsx — fully restored from compiled JS + added sidebar, save stream toggle, share link
- [x] Wallet.tsx — fully restored + dual ZAR/USD display, live exchange rate, minimum withdrawal banner
- [x] Listen.tsx — fully restored + share button on every stream card
- [x] FanProfile.tsx — full page with About/Following artists/Schedule tabs, follow button, FanStatus
- [x] InfluencerProfile.tsx — full page with About/Active promos tabs, follow button, deal proposal modal

### Batch 2
- [x] ArtistCollabs component — search, invite, accept/decline, collab chips
- [x] OGMeta component — og:title/image/description for WhatsApp/Twitter previews
- [x] savedStreams.ts — CRUD server routes with follower visibility gating

### Batch 1
- [x] Artist Settings — TikTok, Facebook, YouTube, SoundCloud social links
- [x] Artist Settings — Spotify, Apple Music, Audiomack, YouTube Music, Deezer links
- [x] Artist Settings — Skills (Sound Engineer, Podcast Host, Graphic Designer, etc.)
- [x] Merchant — gallery tab, sample packs / plugins / software / design categories
- [x] Merchant — "Currently Available" toggle + note
- [x] Store — expanded category filters
- [x] FanStatus component — editable "currently listening to" status

### Foundation
- [x] Sidebar navigation (Desktop + Mobile) — all dashboards
- [x] Home page — decluttered, live user count from Supabase
- [x] Artist photo gallery tab on public profile (followers-only gate pending)
- [x] Merchant "Offer to Dress" + Influencer "Propose Deal" on ArtistProfile
- [x] Wall / Feed — Reels, Snippets, Promos, Merchant catalogue, filter pills
- [x] Admin fan dashboard redirect fixed
- [x] Tier upgrade JSON error fixed (manual_payments table + endpoint)
- [x] Livepeer API key env var fixed (VITE_ prefix)
- [x] Profile selector stuck on Fan — fixed (swaps, not blocks)
- [x] Admin seed script fixed
- [x] Project moved to root, branches merged to main

---

*CheckinPurple · Music · Fashion · Live*
