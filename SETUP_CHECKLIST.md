# ✅ checkinpurple Production Setup Checklist

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Click "Sign Up" (free account)
- [ ] Click "New Project"
- [ ] Fill in details:
  - **Project Name:** checkinpurple
  - **Database Password:** (choose strong password)
  - **Region:** Select closest to your location
  - **Pricing Plan:** Free
- [ ] Click "Create new project" (wait 2-3 minutes)

### 1.2 Get Supabase Credentials
- [ ] Go to **Settings** → **API**
- [ ] Copy **Project URL** (looks like: `https://xxx.supabase.co`)
  - Save as: `VITE_SUPABASE_URL`
- [ ] Copy **"Anon public" key** (long string starting with `eyJ...`)
  - Save as: `VITE_SUPABASE_ANON_KEY`

### 1.3 Create Database Tables
- [ ] Go to **SQL Editor** → **"New Query"**
- [ ] Open file: `database/schema.sql` in your project
- [ ] Copy ALL content
- [ ] Paste into Supabase SQL Editor
- [ ] Click **"Run"** button
- [ ] Check ✓ No errors (you'll see green checkmark)

**Tables created:**
- `users` - User profiles
- `streams` - Live streams
- `tracks` - Track history

### 1.4 Verify Tables
- [ ] Go to **Table Editor** in Supabase
- [ ] Check you see: `users`, `streams`, `tracks` tables

---

## Phase 2: Agora Configuration

### 2.1 Create Agora Project
- [ ] Go to https://console.agora.io
- [ ] Click **"Sign up"** (free account, 10k min/month)
- [ ] Verify email
- [ ] Click **"Console"**
- [ ] Go to **"Projects"** → **"Create"**
- [ ] Fill in:
  - **Project Name:** soundsync
  - **Use case:** Interactive Live Streaming
- [ ] Click **"Create"**

### 2.2 Get Agora Credentials
- [ ] Go to **Project Management**
- [ ] Click on **soundsync** project
- [ ] Copy **App ID** (long alphanumeric string)
  - Save as: `AGORA_APP_ID`
- [ ] Find **Primary Certificate** section
- [ ] Click **"Generate"** button (or copy if already exists)
  - Save as: `AGORA_APP_CERTIFICATE`

---

## Phase 3: Environment Setup

### 3.1 Create .env.local
- [ ] In project root (same level as `package.json`)
- [ ] Create file named: `.env.local`
- [ ] Add content:

```bash
# Supabase (from Phase 1)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Agora (from Phase 2)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

### 3.2 Fill in Your Credentials
Replace:
- `your_supabase_url` → Paste your Project URL
- `your_supabase_anon_key` → Paste your Anon Key
- `your_agora_app_id` → Paste your App ID
- `your_agora_app_certificate` → Paste your Certificate

### 3.3 Save File
- [ ] File saved in project root as `.env.local`

---

## Phase 4: Development Test

### 4.1 Start Dev Server
```bash
pnpm dev
```
- [ ] Should show: `VITE v8.0.2 ready in 123 ms`
- [ ] Should show: `➜  Local: http://localhost:8080`

### 4.2 Test Authentication
- [ ] Open http://localhost:8080
- [ ] Click **"Go Live"** (or artist button)
- [ ] Click **"Create Artist Account"**
- [ ] Sign up with:
  - Email: `test@example.com`
  - Password: `Test123!@#`
  - Username: `testartist`
- [ ] Click **"Create"**
- [ ] ✓ Should redirect to broadcast page

### 4.3 Test Stream Creation
On Broadcast page:
- [ ] Type stream title: "Test Stream"
- [ ] Click **"Go Live"** button
- [ ] ✓ Should show "LIVE" badge
- [ ] ✓ Should show listener count
- [ ] ✓ Should show status "LIVE"

### 4.4 Verify Backend
Check **server console** output:
- [ ] Should have no errors
- [ ] If authenticated errors: Check .env.local credentials

### 4.5 Verify Supabase
In Supabase dashboard:
- [ ] Go to **Table Editor** → **streams**
- [ ] ✓ Should see 1 new stream entry
- [ ] ✓ Status: "live"
- [ ] ✓ Title: "Test Stream"

### 4.6 Test Agora Token
Browser Console (F12):
- [ ] Open DevTools (F12)
- [ ] Go to **Network** tab
- [ ] Click "Go Live" again
- [ ] Look for request to `/api/agora/token`
- [ ] Response should be:
  ```json
  {
    "token": "real-agora-token-string",
    "channelName": "sound_stream_xxx",
    "uid": 123
  }
  ```
- [ ] ✓ Token should NOT start with "mock_token"

### 4.7 Test Listener Discovery
- [ ] Open new browser tab → http://localhost:8080
- [ ] Click **"Listen Live"**
- [ ] Click **"Create Listener Account"**
- [ ] Sign up with different email
- [ ] ✓ Should see "Test Stream" in the grid
- [ ] ✓ Should see listener count
- [ ] Click stream → Should show now playing player

---

## Phase 5: Troubleshooting

### Issue: Auth errors after sign up
**Solution:**
- [ ] Check Supabase URL is correct (no trailing slash)
- [ ] Check Anon Key is correct
- [ ] Check .env.local file exists in project root
- [ ] Restart dev server: `Ctrl+C` then `pnpm dev`

### Issue: Streams not appearing in Supabase
**Solution:**
- [ ] Check RLS policies (should auto-allow inserts)
- [ ] Check database tables exist
- [ ] Check backend logs for errors
- [ ] Check network tab in DevTools

### Issue: Agora token shows "mock_token"
**Solution:**
- [ ] Check `AGORA_APP_ID` is set in .env.local
- [ ] Check `AGORA_APP_CERTIFICATE` is correct
- [ ] Restart dev server
- [ ] Check backend console for errors

### Issue: "Table does not exist"
**Solution:**
- [ ] Run database schema again (copy all of `database/schema.sql`)
- [ ] Check Supabase SQL Editor has no errors (green checkmark)
- [ ] Verify tables in Table Editor

---

## Phase 6: Deployment (Optional)

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

**Set environment variables in Vercel dashboard:**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `AGORA_APP_ID`
- [ ] `AGORA_APP_CERTIFICATE`

---

## Success! 🎉

You should now have:
- ✅ Live streaming working with real Agora tokens
- ✅ Stream creation and discovery from Supabase
- ✅ User authentication with Supabase Auth
- ✅ Production-ready infrastructure (all free tier)

**Next steps:**
1. Customize the UI for your branding
2. Add user profiles and avatars
3. Add streaming categories
4. Implement real-time listener updates
5. Add stream chat/comments
6. Deploy to production