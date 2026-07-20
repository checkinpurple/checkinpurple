# checkinpurple - Architecture & Setup Guide

## Overview

checkinpurple is a real-time music streaming platform where artists can broadcast from their phone storage, and listeners can enjoy live music without the ability to record or download. Built with zero upfront costs using free-tier services.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for bundling
- **Tailwind CSS 3** for styling
- **React Router 6** for SPA routing
- **Agora RTC SDK** for real-time audio (free tier)
- **Supabase JS Client** for authentication & DB

### Backend
- **Express.js** on Node.js
- **Supabase** PostgreSQL (free tier)
- **Agora API** for token generation (free tier)

### Infrastructure
- **Supabase** - Database + Authentication (free)
- **Agora.io** - Real-time audio streaming (10,000 min/month free)
- **Vercel/Netlify** - Hosting (free tier available)

---

## Architecture Diagram

```
Artist Phone (Browser)
    ↓
[Sign In/Sign Up] → Supabase Auth
    ↓
[Broadcast Page] → Request Agora Token → Express Backend
    ↓
Share Audio via Agora RTC
    ↓
Agora Cloud
    ↓
[Listen Page] ← Receive Audio via Agora RTC
    ↓
Listener Phone (Browser)
    ↓
Auto Cache Clear on Stream End
```

---

## API Endpoints

### Streaming APIs

#### Generate Agora Token
```
POST /api/agora/token
Request: { channelName: string, uid: number }
Response: { token: string, channelName: string, uid: number }
```

#### Create Stream
```
POST /api/streams
Request: { userId: string, title: string }
Response: { success: boolean, stream: { id, channelName, title } }
```

#### End Stream (Clears Cache)
```
DELETE /api/streams/:streamId
Response: { success: boolean, message: "Stream ended and cache cleared" }
```

#### Get Stream Details
```
GET /api/streams/:streamId
Response: { stream: { id, title, channelName, listenerCount, startedAt } }
```

#### List Active Streams
```
GET /api/streams
Response: { streams: [...], total: number }
```

#### Update Listener Count
```
POST /api/streams/:streamId/listeners
Request: { count: number }
Response: { success: boolean, listenerCount: number }
```

---

## Database Schema (Supabase PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  role VARCHAR CHECK (role IN ('artist', 'fan')),
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Streams Table
```sql
CREATE TABLE streams (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR CHECK (status IN ('live', 'ended')),
  listener_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  agora_channel VARCHAR NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Tracks Table (For history)
```sql
CREATE TABLE tracks (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project (free tier)
4. Get your **Project URL** and **Anon Key**
5. Create the database tables (see schema above)

### 2. Set Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. (Optional) Set Up Agora.io
For production real-time streaming:
1. Go to [console.agora.io](https://console.agora.io)
2. Create a project
3. Get **App ID** and **App Certificate**
4. Add to `.env.local`:
```
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

**Note:** Without Agora setup, the app uses mock tokens for development. Add your Agora credentials for production.

### 4. Install & Run
```bash
pnpm install
pnpm dev
```

---

## How It Works

### Artist Flow
1. **Sign Up** with email, password, username (role: artist)
2. **Go to Broadcast page** (protected route)
3. **Enter stream title** and click "Go Live"
4. **Select audio files** from phone storage
5. **Start playing music** - audio streams via Agora RTC
6. **Listeners join** the channel
7. **Stream ends** → Audio cache auto-clears (no storage remains)

### Listener Flow
1. **Sign Up** with email, password, username (role: listener)
2. **Go to Listen page** (protected route)
3. **Browse live streams** (auto-updating list from DB)
4. **Click stream** to join
5. **Listen live** via Agora RTC
6. **Cannot record/download** (stream-only protocol)
7. **Click stream ends** → Connection closes

---

## Security Features

### Anti-Recording Protection
- ✅ Agora RTC protocol (stream-only, not downloadable)
- ✅ No download buttons or save options
- ✅ Audio never stored on user device (direct streaming)
- ✅ Browser console cannot capture stream

### Data Security
- ✅ Supabase authentication (email/password)
- ✅ Password hashing (bcrypt)
- ✅ Row Level Security (RLS) on Supabase
- ✅ User data isolated by user_id
- ✅ API token generation (no credentials exposed)

### Cache Management
- ✅ Agora handles audio buffering in memory
- ✅ Stream ends → Auto-clear all buffers
- ✅ No persistent storage of audio
- ✅ Encryption in transit (TLS/SSL)

---

## Agora.io Free Tier Limits

- **10,000 minutes/month** for audio streaming
- **100 concurrent users** per channel
- **Unlimited channels** (up to quota)

**Calculation:**
- 1 artist × 100 listeners × 1 hour = 100 minutes/month
- So you can host ~100 hours of concurrent streaming/month

If you exceed limits, consider:
- Supabase functions to manage connections
- Implement your own WebSocket streaming (cost: server hosting only)
- Upgrade Agora plan ($10-50/month)

---

## Roadmap

### Phase 1 (Current)
- ✅ User authentication (Supabase)
- ✅ Agora RTC integration (streaming)
- ✅ Stream management (create/end)
- ✅ Auto cache clearing
- ✅ Listener joining

### Phase 2
- [ ] Upload custom tracks to Supabase storage
- [ ] Stream history & analytics
- [ ] Tips/donations system
- [ ] Social features (follow artists)
- [ ] Mobile app (React Native)

### Phase 3
- [ ] Multi-artist streams
- [ ] Record for archive (with artist consent)
- [ ] Premium features
- [ ] Monetization

---

## Troubleshooting

### Issue: "Supabase URL or Anon Key is missing"
**Solution:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`

### Issue: "Token generation failed"
**Solution:** Agora not configured. Either:
1. Skip for now (mock tokens work for dev)
2. Add `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` for production

### Issue: "User not found" on sign in
**Solution:** Make sure you created the user in sign up first

### Issue: "Stream not found" when trying to stream
**Solution:** Make sure backend is running (`pnpm dev`)

---

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Supabase | 500MB DB + Auth | $0 |
| Agora.io | 10,000 min/month | $0 |
| Vercel/Netlify | 100GB bandwidth | $0 |
| **Total** | **Fully Functional App** | **$0/month** |

Upgrade when you grow:
- Supabase: $25/month (additional storage)
- Agora.io: ~$0.40/min (overages)
- Vercel/Netlify: $20/month (higher bandwidth)

---

## Next Steps

1. [ ] Create Supabase project
2. [ ] Add environment variables
3. [ ] Run `pnpm dev`
4. [ ] Sign up as artist
5. [ ] Test broadcasting
6. [ ] Sign up as listener
7. [ ] Test listening
8. [ ] Deploy to Vercel/Netlify

Need help? Check the code comments in:
- `client/lib/auth-context.tsx` - Authentication
- `client/pages/Broadcast.tsx` - Streaming interface
- `client/pages/Listen.tsx` - Listener interface
- `server/routes/agora.ts` - Token generation
- `server/routes/streams.ts` - Stream management
