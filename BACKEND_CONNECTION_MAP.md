# 🔗 Backend Connection Map

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│                          
│  Frontend (React)
│  ├── Broadcast.tsx (Artist going live)
│  └── Listen.tsx (Listener discovering streams)
│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST Calls
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Backend Server (Express.js)                      │
├──────────────────────────────────────────────────────────────┤
│
│  server/index.ts (Main server with routes)
│  │
│  ├─ POST /api/streams          → server/routes/streams.ts
│  │  └─ createStream()
│  │     └─ supabase insert()
│  │
│  ├─ GET /api/streams           → server/routes/streams.ts
│  │  └─ listActiveStreams()
│  │     └─ supabase select()
│  │
│  ├─ DELETE /api/streams/:id    → server/routes/streams.ts
│  │  └─ endStream()
│  │     └─ supabase update()
│  │
│  └─ POST /api/agora/token      → server/routes/agora.ts
│     └─ generateAgoraToken()
│        └─ agora-token SDK
│
└──────┬──────────────────────┬──────────────────────────────┘
       │                      │
       │ (via SDK)            │ (via SDK)
       │                      │
       ▼                      ▼
┌──────────────────┐    ┌──────────────────────┐
│    SUPABASE      │    │      AGORA.IO        │
│  (PostgreSQL)    │    │   (Real-time Audio)  │
├──────────────────┤    ├──────────────────────┤
│                  │    │                      │
│ Tables:          │    │ Features:            │
│ - users          │    │ - Token Generation   │
│ - streams        │    │ - Audio Channels     │
│ - tracks         │    │ - Stream Management  │
│                  │    │ - Recording Block    │
│ Auth:            │    │                      │
│ - Email/Pass     │    │ Security:            │
│ - JWT tokens     │    │ - Token Expire 1h    │
│ - RLS policies   │    │ - No recording       │
└──────────────────┘    └──────────────────────┘
```

---

## Data Flow: Artist Goes Live

```
1. Artist Signs Up
   Frontend (Broadcast.tsx)
   ↓ POST /api/streams
   Backend (streams.ts)
   ↓ supabase.from('users').insert()
   ✅ User created in Supabase

2. Artist Clicks "Go Live"
   Frontend (Broadcast.tsx)
   ↓ POST /api/streams { title: "My Stream" }
   Backend (streams.ts)
   ↓ supabase.from('streams').insert()
   ✅ Stream created (id, channelName generated)

3. Artist Needs Audio Token
   Frontend (Broadcast.tsx)
   ↓ POST /api/agora/token { channelName, uid }
   Backend (agora.ts)
   ↓ RtcTokenBuilder.buildTokenWithUid()
   ✅ Agora token returned (expires in 1 hour)

4. Artist Publishes Audio
   Frontend connects to Agora with token
   ↓ Audio uploaded to Agora Cloud
   ✅ Stream is LIVE

5. Backend Updates Listener Count
   Frontend (Broadcast.tsx) polls
   ↓ POST /api/streams/:id/listeners { count: 10 }
   Backend (streams.ts)
   ↓ supabase.from('streams').update()
   ✅ Listener count updated in database
```

---

## Data Flow: Listener Discovers & Joins

```
1. Listener Signs Up
   Frontend (Listen.tsx)
   ↓ POST /api/streams
   Backend (streams.ts)
   ↓ supabase.from('users').insert()
   ✅ User created in Supabase

2. Listener Opens Discovery Page
   Frontend (Listen.tsx)
   ↓ GET /api/streams
   Backend (streams.ts)
   ↓ supabase.from('streams').select()
   ✅ Returns list of live streams from database

3. Listener Clicks Stream
   Frontend gets stream details
   ↓ GET /api/streams/:streamId
   Backend (streams.ts)
   ↓ supabase.from('streams').select()
   ✅ Returns stream with channelName

4. Listener Needs Audio Token
   Frontend (Listen.tsx)
   ↓ POST /api/agora/token { channelName, uid }
   Backend (agora.ts)
   ↓ RtcTokenBuilder.buildTokenWithUid()
   ✅ Agora token returned (listen-only mode)

5. Listener Receives Audio
   Frontend connects to Agora with token (subscribe-only)
   ↓ Audio received from Agora Cloud
   ✅ Stream plays, no recording possible
```

---

## Backend Files & Their Role

### Core Server Setup
```
server/index.ts
├── Creates Express app
├── Sets up CORS
├── Registers all routes
└── Exports createServer()
```

### Database Connection
```
server/lib/supabase.ts
├── Creates Supabase client
├── Uses credentials from .env
├── Exports supabase instance
└── Used by all stream operations
```

### Route Handlers
```
server/routes/streams.ts
├── createStream()      - Create new broadcast
├── endStream()         - End a broadcast
├── getStream()         - Get stream details
├── listActiveStreams() - List all live streams
└── updateListenerCount() - Update listeners

server/routes/agora.ts
└── generateAgoraToken() - Generate RTC token
```

---

## Environment Variables & Services

### .env.local Mapping

```
┌────────────────────────────────────┐
│      Your App (.env.local)         │
├────────────────────────────────────┤
│                                    │
│ VITE_SUPABASE_URL ──────────┐     │
│                             │     │
│ VITE_SUPABASE_ANON_KEY ─┐   │     │
│                         │   │     │
└─────────────────────────┼───┼─────┘
                          │   │
                          ▼   ▼
                    ┌──────────────────┐
                    │   SUPABASE       │
                    │                  │
                    │ Runs:            │
                    │ - Database       │
                    │ - Auth           │
                    │ - Realtime       │
                    └──────────────────┘

┌─────────────────────────────────────┐
│                                     │
│ AGORA_APP_ID ────────────────┐      │
│                              │      │
│ AGORA_APP_CERTIFICATE ──┐    │      │
│                         │    │      │
└─────────────────────────┼────┼──────┘
                          │    │
                          ▼    ▼
                    ┌──────────────────┐
                    │   AGORA.IO       │
                    │                  │
                    │ Provides:        │
                    │ - Audio relay    │
                    │ - Token creation │
                    │ - Stream encode  │
                    └──────────────────┘
```

---

## Server Routes & Supabase Queries

### Stream Creation
```
POST /api/streams
Request: { userId, title }
│
├─ Generate streamId
├─ Generate channelName
│
└─ supabase.from('streams').insert({
     id: streamId,
     user_id: userId,
     title: title,
     agora_channel: channelName,
     status: 'live'
   })
   
Response: { success, stream: { id, channelName } }
```

### List Active Streams
```
GET /api/streams
│
└─ supabase.from('streams').select()
     .eq('status', 'live')
     .order('started_at', { ascending: false })
   
Response: { streams: [...], total: count }
```

### Get Stream Details
```
GET /api/streams/:streamId
│
└─ supabase.from('streams').select()
     .eq('id', streamId)
     .single()
   
Response: { stream: { id, title, channelName, listeners } }
```

### End Stream
```
DELETE /api/streams/:streamId
│
└─ supabase.from('streams').update({
     status: 'ended',
     ended_at: now()
   })
   .eq('id', streamId)
   
Response: { success, message: "Stream ended..." }
```

### Generate Agora Token
```
POST /api/agora/token
Request: { channelName, uid }
│
├─ Check AGORA_APP_ID exists
├─ Check AGORA_APP_CERTIFICATE exists
│
└─ RtcTokenBuilder.buildTokenWithUid(
     appId,
     certificate,
     channelName,
     uid,
     PUBLISHER,
     expirationTime,
     expirationTime
   )
   
Response: { token, channelName, uid }
```

---

## Security & RLS Policies

### Supabase Row Level Security

After running `database/schema.sql`, you have:

```
Users Table RLS:
- SELECT: Users can view own profile
- UPDATE: Users can edit own profile

Streams Table RLS:
- SELECT: Anyone can view LIVE streams
- INSERT: Only stream owner can create
- UPDATE: Only stream owner can update
- DELETE: Only stream owner can delete

Tracks Table RLS:
- ALL: Only owner can manage
```

---

## Error Handling Flow

```
Request to Backend
│
├─ Request validation
│  └─ If invalid: return 400 { error: "..." }
│
├─ Environment check
│  └─ If missing: return 401 { error: "Missing credentials" }
│
├─ Database operation
│  └─ If fails: return 500 { error: "Database error" }
│
├─ Token generation
│  └─ If fails: return 500 { error: "Token generation failed" }
│
└─ Success: return 200 { success: true, data: {...} }
```

---

## Testing Checklist

After setup, verify each component:

- [ ] Backend runs without errors: `pnpm dev`
- [ ] Supabase credentials valid: Check .env.local
- [ ] Database tables exist: Check Supabase table editor
- [ ] Agora credentials valid: Token not "mock_token"
- [ ] User creation works: Can sign up
- [ ] Stream creation works: Appears in Supabase
- [ ] Stream listing works: Can discover streams
- [ ] Agora tokens real: Check network response
- [ ] Listener count updates: See changes in database

**If all ✅ = Production ready!**