# CheckinPurple — Supabase Blank Screen Diagnostic

The code is fine. The blank screen is caused by one or more of these
Supabase configuration issues. Work through them in order.

---

## Step 1 — Run the full schema SQL

If you haven't already, run `checkinpurple-schema.sql` in the Supabase
SQL Editor. The `users` table must exist before anything works.

Quick check — run this in SQL Editor:
```sql
SELECT COUNT(*) FROM users;
```
If it errors with "relation does not exist", run the schema SQL first.

---

## Step 2 — Disable email confirmation (most common cause)

Supabase requires email confirmation by default. If a user registers but
hasn't confirmed their email, `signInWithPassword` succeeds but
`auth.users` marks them unconfirmed — the app then can't create a session.

**Fix:**
1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** → **OFF**
3. Save

To confirm existing unconfirmed users:
```sql
UPDATE auth.users SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
```

---

## Step 3 — Fix Row Level Security (most likely cause of blank screen)

RLS is enabled on `users` but the INSERT policy may be blocking the app
from creating the profile row when a user first logs in. Without a row in
`users`, the app falls back to auth metadata — but if RLS also blocks
SELECT, `setUser` gets `null` and the dashboard renders nothing.

Run this in SQL Editor:

```sql
-- Drop and recreate clean RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run even if they don't exist)
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Anyone can read user profiles (needed for public artist/fan pages)
CREATE POLICY "users_select_all" ON users
  FOR SELECT USING (true);

-- Authenticated users can insert their own row
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can do anything (needed for admin functions)
-- This is automatic for service role key, no policy needed.
```

Also fix user_profiles RLS:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;

CREATE POLICY "user_profiles_select_all" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## Step 4 — Check Vercel environment variables

All of these must be set in **Vercel → Project → Settings → Environment Variables**:

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `LIVEPEER_API_KEY` | Livepeer Studio → API Keys |
| `RESEND_API_KEY` | Resend → API Keys |

**Critical:** `VITE_` prefix is required for the two keys used in the
browser. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose it
to the client.

After adding/changing any env var, **redeploy** on Vercel.

---

## Step 5 — Verify the users table has your account

After logging in, run this in SQL Editor:
```sql
SELECT id, email, username, role FROM users ORDER BY created_at DESC LIMIT 10;
```

If your email is in `auth.users` but NOT in `users`, it means the INSERT
policy is blocking profile row creation. Fix Step 3 then run:

```sql
-- Manually create profile rows for existing auth users that are missing one
INSERT INTO users (id, email, username, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || LEFT(au.id::text, 8)),
  COALESCE(au.raw_user_meta_data->>'role', 'fan'),
  au.created_at
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

---

## Step 6 — Check browser console errors

Open DevTools (F12) → Console tab → refresh the page after login.
The most common errors and their fixes:

| Console error | Fix |
|---|---|
| `Failed to fetch` or `NetworkError` | Vercel env vars missing or wrong |
| `JWT expired` | User session expired — sign out and back in |
| `row-level security policy violation` | Run Step 3 SQL |
| `relation "users" does not exist` | Run schema SQL (Step 1) |
| `new row violates check constraint` | users table exists but wrong schema |
| No errors but blank screen | `setLoading` bug — apply `cp-supabase-fix.zip` |

