# 🚀 Supabase & Agora Integration Guide

## Quick Overview

SoundSync backend uses:
- **Supabase** for authentication and database (users, streams, tracks)
- **Agora** for real-time audio streaming with security

All **FREE TIER** - no credit card needed!

---

## ⚡ QUICK START (5 minutes)

### Step 1: Supabase Signup & Credentials

1. **Create Account**
   - Go to https://supabase.com
   - Click "Sign Up"
   - Use Email/GitHub (free forever)

2. **Create Project**
   - Click "New Project"
   - **Name:** soundsync
   - **Password:** (any secure password)
   - **Region:** Pick closest to you (e.g., us-east-1)
   - **Pricing:** Free (top option)
   - Click "Create new project" (wait 2-3 min)

3. **Get Credentials**
   - After project loads, go **Settings → API**
   - **Copy these:**
     - **Project URL** (starts with `https://xxx.supabase.co`)
     - **Anon public key** (long string, starts with `eyJ`)

4. **Run Database Schema**
   - Go **SQL Editor**
   - Click **"New Query"**
   - Open `/database/schema.sql` from your project
   - Copy everything
   - Paste in Supabase editor
   - Click **"Run"** (green checkmark = success)

### Step 2: Agora Signup & Credentials

1. **Create Account**
   - Go to https://console.agora.io
   - Click "Sign up" (free)
   - Verify email

2. **Create Project**
   - After login, go **Project Management**
   - Click **"Create"**
   - **Name:** soundsync
   - **Use case:** Interactive Live Streaming
   - Click **"Create"**

3. **Get Credentials**
   - Go **Project Management** → Click **soundsync**
   - **Copy these:**
     - **App ID** (alphanumeric string)
     - **Primary Certificate** - click **"Generate"** or copy if exists

### Step 3: Create .env.local

1. **Create File**
   - In project root (same folder as `package.json`)
   - Create new file: `.env.local`

2. **Add Credentials**
   ```bash
   # Supabase (from Step 1)
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1Qi...

   # Agora (from Step 2)
   AGORA_APP_ID=abc123def456ghi789
   AGORA_APP_CERTIFICATE=abcdefghijklmnopqrstuvwxyz123456
   ```

3. **Save** (Ctrl+S or Cmd+S)

### Step 4: Test It!

```bash
pnpm dev
```

- Open http://localhost:8080
- Sign up as "Artist"
- Click "Go Live"
- ✓ See "LIVE" badge
- Open new tab, sign up as "Listener"
- ✓ See your stream
- Success! 🎉

---

## 🔧 Backend Architecture

### Server Routes (Express)

```
POST /api/streams                  # Create new stream
GET  /api/streams                  # List all live streams
GET  /api/streams/:streamId        # Get stream details
POST /api/streams/:streamId/listeners  # Update listener count
DELETE /api/streams/:streamId      # End stream

POST /api/agora/token              # Generate Agora token
```

### Database Tables (Supabase)

**users** - User profiles
```
✓ id (from auth)
✓ email
✓ username
✓ role (artist/fan)
✓ avatar_url
✓ created_at
```

**streams** - Live streams
```
✓ id
✓ user_id (artist)
✓ title
✓ status (live/ended)
✓ listener_count
✓ started_at
✓ ended_at
✓ agora_channel
```

### Agora Integration

**Token Generation Flow:**
1. Artist clicks "Go Live"
2. Frontend calls `POST /api/agora/token`
3. Backend uses Agora SDK to generate token
4. Token sent to frontend
5. Frontend joins Agora channel with token
6. Audio streams in real-time

**Security:**
- Tokens expire after 1 hour
- Only authorized users can get tokens
- Listeners can't record (stream-only protocol)

---

## 🐛 Troubleshooting

### Test 1: Check Environment Variables

```bash
cat .env.local
```

Should show all 4 variables filled in (not "your_xxx")

### Test 2: Check API Routes

In browser DevTools (F12):

1. Go to **Network** tab
2. Click "Go Live"
3. Look for requests to:
   - `/api/streams` - Should return new stream
   - `/api/agora/token` - Should return token

### Test 3: Check Supabase Connection

In Supabase dashboard:
- Go **Table Editor**
- Click **streams**
- After going live, should see new row
- If empty: Check RLS policies

### Test 4: Check Agora Token

In browser console:

1. F12 → **Network** tab
2. Go Live
3. Click `/api/agora/token` request
4. Go to **Response** tab
5. Should see token like:
   ```json
   {
     "token": "007a2a8...real-token...",
     "channelName": "sound_stream_123",
     "uid": 456
   }
   ```
6. If shows "mock_token": Agora credentials missing

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Supabase URL missing" | Check `.env.local` has `VITE_SUPABASE_URL=` |
| "Table does not exist" | Run `database/schema.sql` again in Supabase |
| "Unauthorized" errors | Check Supabase anon key is correct |
| Token shows "mock_token" | Set `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` |
| Streams not showing | Check RLS policy (should allow select for status='live') |

---

## 📝 Environment Variables Reference

```bash
# SUPABASE CREDENTIALS
# Get from: Settings → API → Project URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Get from: Settings → API → Anon public key
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# AGORA CREDENTIALS  
# Get from: Project Management → Project → App ID
AGORA_APP_ID=abc123def456ghi789jkl012

# Get from: Project Management → Project → Primary Certificate
AGORA_APP_CERTIFICATE=abcdefghijklmnopqrstuvwxyz1234567890abcd
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Can sign up with Supabase auth
- [ ] Can create stream (appears in Supabase)
- [ ] Can see live streams (from database)
- [ ] Real Agora token generated (not mock)
- [ ] Can join as listener
- [ ] Backend console shows no errors

---

## 🔗 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Agora Docs:** https://docs.agora.io
- **SoundSync Architecture:** See `ARCHITECTURE.md`
- **Database Schema:** See `database/schema.sql`

---

## 🎯 Next: Production Deployment

Once everything works locally, deploy to:

- **Vercel** (frontend + backend)
- **Supabase** (database - already hosted)
- **Agora** (streaming - already hosted)

See `PRODUCTION_SETUP.md` for deployment steps.