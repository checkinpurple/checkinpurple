# CheckinPurple · Music · Fashion · Live

A full-stack music platform for South Africa and beyond. Artists stream live, fans tip with coins, merchants sell fashion and merch, influencers promote music and earn commission — all in one account.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38b2ac)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.x-90c53f)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)
[![Livepeer](https://img.shields.io/badge/Livepeer-Streaming-green)](https://livepeer.studio/)

---

## What It Is

CheckinPurple gives every user up to four profile types in a single account:

| Profile | What they do |
|---------|-------------|
| **Fan** | Discover live streams, tip artists with coins, RSVP to gigs, set "currently listening" status |
| **Artist** | Go live via Livepeer, earn coin tips (70% to artist), manage bookings, upload gallery, link streaming platforms |
| **Merchant** | Sell merch, fashion, sample packs, plugins, software and design services. Offer to dress artists |
| **Influencer** | Negotiate promotion deals directly with artists, earn commission from artist earnings (not a CheckinPurple cut) |

Tiers unlock more profiles — Basic (1), Standard (2), Premium (all 4).

---

## Features

### Artist
- Live streaming via Livepeer (RTMP + web audio player)
- Save streams with Public / Followers Only / Private visibility
- Coin tips — artists keep 70%, withdraw via PayPal or bank transfer
- Booking requests with approval flow and email notification to fan
- Photo gallery (followers-only) uploaded to Supabase Storage
- Streaming links: Spotify, Apple Music, Audiomack, YouTube Music, Deezer
- Social links: Instagram, Twitter, TikTok, Facebook, YouTube, SoundCloud
- Skills for hire: Sound Engineer, Producer, Graphic Designer, Podcast Host, etc.
- Booking availability calendar with selectable date slots
- Personalised playlists tagged to specific fans or groups
- Collaborate with other artists (invite, accept, decline)
- Past Streams library with edit and delete

### Fan
- Browse and listen to live streams
- Tip artists with coins during streams
- "Currently listening to" status shown on profile
- Public fan profile with Following and Schedule tabs
- Fan availability schedule for event attendance
- RSVP to gigs and listening parties

### Influencer
- Propose and negotiate promotion deals directly with artists
- Commission paid by artist — not a platform cut
- Referral link generator
- Discover Music tab (live streams to promote)
- Public profile showing reach, platforms, rate
- Active deals auto-posted to the Wall

### Merchant
- Product catalogue: Merch, Fashion, Digital, Ticket, Sample Pack, Plugin, Software, Graphic Design
- Photo gallery for physical catalogue
- "Currently Available" toggle — auto-posts to Wall
- Offer to dress artists, manage dressing requests
- Discover Music tab to find artists to collaborate with
- Gallery strip shown on Store product cards

### Wall / Feed
- Timeline with post types: Live Stream, Reel, Song Snippet, Influencer Promo, Merchant Drop
- Filter pills: All / Live / Reels / Snippets / Promos / Drops
- Real API (`/api/wall/feed`) — auto-posts from streams, merchant availability, influencer deals
- Share any stream with Web Share API + clipboard fallback

### Admin
- User count from `auth.users` (real registration count, not profile table)
- "No Profile" badge for users who registered but haven't set up
- User table with role editor, ban/unban
- Submissions, payout requests, streams, gigs tabs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router 6 |
| Backend | Express.js, Node.js, TypeScript |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Streaming | Livepeer (RTMP ingest, HLS playback, recording) |
| Email | Resend (payout notifications, booking approvals) |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Project Structure

```
checkinpurple/
├── client/
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── SignUp.tsx             # Registration with tier + profile selection
│   │   ├── SignIn.tsx             # Login
│   │   ├── Dashboard.tsx          # Main hub with role-aware quick actions
│   │   ├── Broadcast.tsx          # Artist live streaming
│   │   ├── Listen.tsx             # Fan stream discovery
│   │   ├── Wall.tsx               # Social feed / timeline
│   │   ├── ArtistProfile.tsx      # Public artist page
│   │   ├── ArtistSettings.tsx     # Artist profile editor
│   │   ├── FanProfile.tsx         # Public fan page
│   │   ├── InfluencerProfile.tsx  # Public influencer page
│   │   ├── InfluencerSettings.tsx # Influencer profile editor
│   │   ├── Merchant.tsx           # Merchant dashboard
│   │   ├── Influencer.tsx         # Influencer dashboard
│   │   ├── Store.tsx              # Public store
│   │   ├── Wallet.tsx             # Artist earnings + withdrawals
│   │   ├── Bookings.tsx           # Booking requests
│   │   ├── PastStreams.tsx         # Saved stream recordings
│   │   ├── Playlists.tsx          # Personalised playlists
│   │   ├── Tiers.tsx              # Upgrade plans + role preview
│   │   ├── ListeningParties.tsx   # Group listening events
│   │   ├── BuyCoins.tsx           # Coin purchase
│   │   └── Admin.tsx              # Admin panel
│   ├── components/
│   │   ├── AppSidebar.tsx         # Desktop + mobile navigation
│   │   ├── ArtistCollabs.tsx      # Collab invite/accept UI
│   │   ├── AvailabilityCalendar.tsx # Booking date picker
│   │   ├── FanStatus.tsx          # "Currently listening" widget
│   │   ├── OGMeta.tsx             # Open Graph meta tags
│   │   ├── RolePreview.tsx        # Profile preview before upgrade
│   │   ├── Chat.tsx               # Live stream chat
│   │   ├── Notifications.tsx      # In-app notification bell
│   │   ├── ProfileCard.tsx        # Editable profile header
│   │   └── TransferCoins.tsx      # Coin transfer UI
│   └── lib/
│       ├── supabase.ts            # Supabase client
│       └── auth-context.tsx       # Global auth state + profile fetch
│
├── server/
│   ├── routes/
│   │   ├── streams.ts             # Stream CRUD + wall auto-post
│   │   ├── artist.ts              # Bookings, gigs, gallery, collab
│   │   ├── social.ts              # Follow/unfollow + notifications
│   │   ├── subscriptions.ts       # Tiers, coins, tips, payouts
│   │   ├── admin.ts               # Admin user management
│   │   ├── wall.ts                # Wall feed aggregation
│   │   ├── store.ts               # Products, orders
│   │   ├── playlists.ts           # Playlist CRUD
│   │   ├── savedStreams.ts         # Saved stream CRUD
│   │   ├── merchant-influencer-extras.ts # Availability, deals, collabs, dressing
│   │   ├── notifications.ts       # Notification helper functions
│   │   ├── livepeer.ts            # Stream key generation
│   │   └── payments.ts            # Manual claim, PayPal
│   ├── lib/
│   │   └── supabase.ts            # Server Supabase client (service role)
│   └── index.ts                   # Express app + all route registration
│
└── shared/
    └── api.ts                     # Shared TypeScript types
```

---

## Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

```env
# Client-side (must have VITE_ prefix)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=eyJ...
LIVEPEER_API_KEY=your-livepeer-key
RESEND_API_KEY=re_...
```

---

## Database Setup

Run `checkinpurple-FULL-schema.sql` in Supabase SQL Editor once.
It creates all 23 tables, sets RLS policies, seeds default data,
and backfills profile rows for existing auth accounts.

See `SUPABASE_SETUP.md` for the full 6-step guide.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Copy env file
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server (frontend + backend)
pnpm dev

# Open http://localhost:8080
```

---

## Deployment

```bash
# Push to GitHub
git add -A
git commit -m "your message"
git push origin main

# Vercel auto-deploys on push
# Make sure all env vars are set in Vercel dashboard
```

---

## Coin Economy

| Action | Amount |
|--------|--------|
| Artist keeps per tip | 70% |
| Platform cut per tip | 30% |
| 1 coin face value | R0.10 |
| 1 coin to artist | R0.07 |
| Minimum withdrawal | R200 / $11 |
| Payout methods | PayPal, Bank Transfer |

Live USD/ZAR rate fetched from exchangerate-api.com on wallet load.

---

## API Reference (key endpoints)

```
Auth
  POST   /api/auth/*                    Supabase handles auth

Streams
  GET    /api/streams                   List active streams
  POST   /api/streams                   Create stream (go live)
  DELETE /api/streams/:id               End stream
  GET    /api/streams/saved             My saved recordings
  POST   /api/streams/saved             Save a recording
  PATCH  /api/streams/saved/:id         Edit title/visibility
  DELETE /api/streams/saved/:id         Delete recording

Wall
  GET    /api/wall/feed                 Aggregated timeline feed

Store
  GET    /api/store/products/public     Public product listing
  POST   /api/store/products            Create product
  GET    /api/store/orders              My orders

Artist
  POST   /api/bookings                  Create booking request
  PATCH  /api/bookings/:id              Accept/decline booking
  POST   /api/gigs                      Post a gig
  GET    /api/gigs/:username            Artist's gigs

Social
  GET    /api/social/follows            Follow counts
  POST   /api/social/follow             Follow user
  DELETE /api/social/follow             Unfollow user

Coins & Payments
  GET    /api/coins/balance             My coin balance
  POST   /api/coins/tip                 Tip an artist
  POST   /api/payments/methods          Request payout
  POST   /api/payments/manual-claim     Manual tier claim

Collaborations
  POST   /api/collaborations            Send collab invite
  PATCH  /api/collaborations/:id        Accept/decline

Dressing Requests
  POST   /api/dressing-requests         Merchant offers to dress artist
  PATCH  /api/dressing-requests/:id     Artist accepts/declines

Influencer Deals
  POST   /api/influencer/deals          Artist proposes deal
  PATCH  /api/influencer/deals/:id      Accept/decline deal

Merchant
  POST   /api/merchant/availability     Toggle available + wall post

Admin
  GET    /api/admin/users               List all users (from auth)
  PATCH  /api/admin/users/:id/role      Change user role
  PATCH  /api/admin/users/:id/ban       Ban/unban user
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank screen after login | Run schema SQL, check Supabase RLS, see `SUPABASE_SETUP.md` |
| `relation "users" does not exist` | Run `checkinpurple-FULL-schema.sql` |
| User count shows 0 | `SUPABASE_SERVICE_ROLE_KEY` missing from Vercel |
| Livepeer stream key error | Check `LIVEPEER_API_KEY` in Vercel env vars |
| Emails not sending | Check `RESEND_API_KEY` + verify domain in Resend |
| Upload fails | Create `artist-gallery` bucket in Supabase Storage (set public) |

---

*CheckinPurple · Music · Fashion · Live · South Africa*
