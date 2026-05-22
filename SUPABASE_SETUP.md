# SoundSync - Supabase Setup Guide

Complete step-by-step guide to connect your Supabase project for React/Vite.

## ✅ You Already Have

```
VITE_SUPABASE_URL=https://jyyynjetoctkyfhwsisr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yszP7rDoPR1HEp5yoTLBrg_JCrFRYNv
```

These are already in `.env.local` ✓

---

## Step 1: Create Database Tables

Go to your Supabase project → **SQL Editor** → Create new query → Copy & paste:

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  role VARCHAR NOT NULL CHECK (role IN ('artist', 'fan')),
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Streams table
CREATE TABLE IF NOT EXISTS public.streams (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  listener_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  agora_channel VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tracks table (for future archive)
CREATE TABLE IF NOT EXISTS public.tracks (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON public.streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON public.streams(status);
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON public.tracks(user_id);
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can read active streams
CREATE POLICY "Anyone can read active streams"
  ON public.streams
  FOR SELECT
  USING (status = 'live');

-- Users can create streams
CREATE POLICY "Users can create streams"
  ON public.streams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own streams
CREATE POLICY "Users can update their own streams"
  ON public.streams
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read their own tracks
CREATE POLICY "Users can read their own tracks"
  ON public.tracks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create tracks
CREATE POLICY "Users can create tracks"
  ON public.tracks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Step 2: Set Up Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Make sure **Email** provider is enabled (default)
3. Go to **URL Configuration**:
   - Add `http://localhost:8080` to Redirect URLs (for development)
   - Add your production domain later

---

## Step 3: Test Connection

In your app, you can now:

```typescript
import { supabase } from '@/lib/supabase';

// Sign up
await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    data: {
      username: 'testuser',
      role: 'artist'
    }
  }
});

// Sign in
await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});

// Fetch data
const { data: streams } = await supabase
  .from('streams')
  .select('*')
  .eq('status', 'live');
```

---

## Step 4: Fix Common Issues

### Issue: "Supabase URL or Anon Key is missing"
✅ **Solution:** Already fixed! Keys are in `.env.local`

### Issue: "Auth users table not found"
✅ **Solution:** Run the SQL queries above in Supabase SQL Editor

### Issue: "Row Level Security denied"
✅ **Solution:** Run the RLS policies above

### Issue: "CORS error"
✅ **Solution:** Go to **Authentication** → **URL Configuration** → Add your domain

---

## Step 5: Verify Everything Works

Your app should now be fully connected to Supabase! Test:

1. **Sign Up Page** - Create account
2. **Sign In Page** - Login
3. **Broadcast Page** - Check if logged in user shows
4. **Listen Page** - Try to fetch streams

---

## Project Structure (Updated)

```
client/
├── lib/
│   ├── supabase.ts          ✅ Already configured
│   └── auth-context.tsx     ✅ Already using Supabase
├── pages/
│   ├── SignUp.tsx           ✅ Uses Supabase Auth
│   ├── SignIn.tsx           ✅ Uses Supabase Auth
│   ├── Broadcast.tsx        ✅ Uses Supabase for streams
│   └── Listen.tsx           ✅ Fetches from Supabase
```

---

## Database Schema Reference

### `users` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | From auth.users |
| `email` | VARCHAR | From auth |
| `username` | VARCHAR | Unique |
| `role` | VARCHAR | 'artist' or 'fan' |
| `avatar_url` | VARCHAR | Profile picture |
| `created_at` | TIMESTAMP | Auto |

### `streams` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR | Primary key |
| `user_id` | UUID | Artist ID |
| `title` | VARCHAR | Stream name |
| `status` | VARCHAR | 'live' or 'ended' |
| `listener_count` | INTEGER | Real-time count |
| `started_at` | TIMESTAMP | When stream started |
| `ended_at` | TIMESTAMP | When stream ended |
| `agora_channel` | VARCHAR | Agora RTC channel |

### `tracks` Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR | Primary key |
| `user_id` | UUID | Artist ID |
| `title` | VARCHAR | Track name |
| `duration` | INTEGER | Seconds |

---

## Next: Test Your App

1. Run: `pnpm dev`
2. Open: `http://localhost:8080`
3. Sign up as artist
4. Check Supabase → **Table Editor** → see new user created
5. Go live and verify stream appears in database

---

## Troubleshooting

**Q: "Table 'streams' doesn't exist"**
- Run the CREATE TABLE SQL above

**Q: "User created but shows in auth only, not in users table"**
- The auth hook might not have fired. Manually create user record or wait for auth trigger to execute

**Q: "Can't sign in after signing up"**
- Verify email in Supabase Auth dashboard
- Check that user record was created

**Q: "Streams not showing for listeners"**
- Verify RLS policies are correct
- Check artist ID matches in database

---

## Deploy to Production

When deploying to Vercel/Netlify:

1. Add environment variables in platform settings:
   ```
   VITE_SUPABASE_URL=https://jyyynjetoctkyfhwsisr.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_yszP7rDoPR1HEp5yoTLBrg_JCrFRYNv
   ```

2. Update Supabase URL Configuration:
   - Add your production domain to Redirect URLs
   - Example: `https://yourdomain.vercel.app`

3. Deploy!

---

## Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **This project's Architecture:** See `ARCHITECTURE.md`
- **API Reference:** See `API_SPEC.md`
- **Quick Start:** See `QUICKSTART.md`

---

## Supabase CLI Linking + Migrations (Production)

If you deploy backend routes that depend on new tables/columns, link your local project to Supabase and push migrations:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

To verify migration status:

```bash
supabase migration list
```

For this current change set (Broadcast/Listen/Wallet UI + Livepeer request flow + Store affiliate link rendering), **no new SQL migration is required**.
