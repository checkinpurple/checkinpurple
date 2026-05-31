# CheckinPurple — Supabase Setup Guide

Follow these steps in order. Most blank screen issues come from Step 1 or 2.

---

## Step 1 — Run the full schema SQL (do this first)

1. Open **Supabase → SQL Editor**
2. Paste and run the entire `checkinpurple-FULL-schema.sql` file
3. You should see "Success. No rows returned" at the end

This creates every table, all RLS policies, seeds default data, and
backfills profile rows for anyone already registered.

---

## Step 2 — Disable email confirmation

This is the most common cause of the blank screen after login.

1. **Supabase → Authentication → Providers → Email**
2. Toggle **"Confirm email"** → **OFF**
3. Click **Save**

The schema SQL already confirms all existing users, but turning this off
prevents future signups from getting stuck.

---

## Step 3 — Set Vercel environment variables

Go to **Vercel → Your Project → Settings → Environment Variables**
and add all of these:

| Variable | Value | Where to find it |
|----------|-------|-----------------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API → service_role |
| `LIVEPEER_API_KEY` | `xxx` | livepeer.studio → API Keys |
| `RESEND_API_KEY` | `re_xxx` | resend.com → API Keys |

After adding variables, click **Redeploy** in Vercel.

**Important:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used
by the browser. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never put it
in a `VITE_` variable.

---

## Step 4 — Create Storage bucket

1. **Supabase → Storage → New bucket**
2. Name: `artist-gallery`
3. Toggle **Public bucket** → ON
4. Click **Save**

---

## Step 5 — Verify it's working

In SQL Editor, run:
```sql
SELECT id, email, username, role FROM users ORDER BY created_at DESC LIMIT 5;
```

You should see your account. If you don't, run:
```sql
INSERT INTO users (id, email, username, role, created_at)
SELECT au.id, au.email,
  COALESCE(au.raw_user_meta_data->>'username', 'user_' || LEFT(au.id::text, 8)),
  COALESCE(au.raw_user_meta_data->>'role', 'fan'),
  au.created_at
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

---

## Step 6 — Check browser console if still blank

Open **DevTools → Console** after login. Match your error:

| Error message | Fix |
|---|---|
| `relation "users" does not exist` | Run the schema SQL (Step 1) |
| `new row violates row-level security` | Schema SQL runs RLS fix automatically |
| `JWT expired` or `invalid JWT` | Sign out → sign in again |
| `Failed to fetch` / `NetworkError` | Vercel env vars wrong or missing (Step 3) |
| `VITE_SUPABASE_URL is not defined` | Add env vars to Vercel and redeploy |
| No error but blank | Apply `cp-supabase-fix.zip` (auth-context fix) |

