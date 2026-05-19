# SoundSync - Quick Start Guide

Get your streaming platform up and running in 5 minutes.

## What You're Building

A real-time music streaming app where:
- ✅ Artists broadcast music from phone storage
- ✅ Listeners join live streams globally
- ✅ Audio only exists during the broadcast (auto-clears after)
- ✅ Listeners cannot record or download
- ✅ Zero upfront costs (Supabase + Agora free tier)

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free at supabase.com)
- A browser (modern Chrome, Firefox, Safari, Edge)

## 5-Minute Setup

### Step 1: Clone & Install (1 min)
```bash
git clone <repo-url>
cd soundsync
pnpm install
```

### Step 2: Create Supabase Project (2 min)
1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project
3. Copy your **Project URL** and **Anon Key**
4. Create `.env.local` in project root:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 3: Run Dev Server (1 min)
```bash
pnpm dev
```

Visit `http://localhost:8080` in your browser.

### Step 4: Test the App (1 min)
1. Click "Create Artist Account"
2. Sign up with email + password
3. Go Live and see the broadcast interface
4. Open new browser tab → `localhost:8080`
5. Click "Create Listener Account" → Explore streams

Done! 🎉

---

## For Production Streaming

To use **real audio streaming** (currently uses mock tokens):

### Optional: Add Agora.io
1. Go to [console.agora.io](https://console.agora.io)
2. Sign up (free tier: 10,000 min/month)
3. Create project → Copy **App ID** and **App Certificate**
4. Add to `.env.local`:
   ```
   AGORA_APP_ID=your_app_id
   AGORA_APP_CERTIFICATE=your_app_certificate
   ```
5. Restart dev server (`pnpm dev`)

Now your streams will use real Agora audio instead of mock tokens.

---

## Folder Structure

```
soundsync/
├── client/
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Landing page
│   │   ├── SignUp.tsx      # Sign up form
│   │   ├── SignIn.tsx      # Sign in form
│   │   ├── Broadcast.tsx   # Artist streaming
│   │   └── Listen.tsx      # Listener discovery
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   └── auth-context.tsx # Auth state management
│   └── global.css          # Tailwind config
│
├── server/
│   ├── routes/
│   │   ├── agora.ts        # Token generation
│   │   └── streams.ts      # Stream management
│   └── index.ts            # Express app
│
├── ARCHITECTURE.md         # Full architecture guide
├── API_SPEC.md            # API documentation
└── QUICKSTART.md          # This file
```

---

## Key Features Explained

### 1. Authentication (Supabase)
- Email/password signup & signin
- Role-based access (artist vs listener)
- Automatic session management
- Profile data stored in PostgreSQL

### 2. Live Streaming (Agora.io)
- Artist uploads audio → streams live
- Listeners join via Agora RTC
- Real-time listener count
- **No recording capability** (protocol-level)

### 3. Auto Cache Clear
- When stream ends → cache deleted
- No audio remains on server
- No data on user device
- 100% privacy on stream content

### 4. Design System
- Dark theme with purple/pink accents
- Responsive (mobile to desktop)
- Smooth animations
- Accessibility built-in (WCAG AA)

---

## Common Tasks

### To Deploy
```bash
# Build production bundle
pnpm build

# Deploy to Vercel/Netlify
# (Follow platform-specific instructions)
```

### To Add a New Page
1. Create `client/pages/YourPage.tsx`
2. Add route in `client/App.tsx`:
   ```tsx
   <Route path="/your-page" element={<YourPage />} />
   ```
3. Done!

### To Create a New API Endpoint
1. Create `server/routes/your-route.ts`
2. Add route in `server/index.ts`:
   ```ts
   import { yourHandler } from "./routes/your-route";
   app.post("/api/your-endpoint", yourHandler);
   ```
3. Call from frontend:
   ```ts
   fetch('/api/your-endpoint', { method: 'POST', body: ... })
   ```

### To Add Database Table
1. Go to Supabase → SQL Editor
2. Run your CREATE TABLE statement
3. Use via `supabase.from('table').select()` in code

---

## Troubleshooting

**Q: "Cannot find module '@supabase/supabase-js'"**
- Run: `pnpm install`

**Q: "Supabase URL or Anon Key is missing"**
- Check `.env.local` has correct variables
- Restart dev server: `pnpm dev`

**Q: "Sign up fails"**
- Check Supabase is online
- Check API endpoint in `.env.local`

**Q: "Broadcast page shows 'not found'"**
- Make sure you're signed in
- Try signing up first

**Q: "Listen page is empty"**
- No active streams yet! Have another user go live

**Q: "Can't hear audio"**
- Without Agora setup, using mock tokens (no real audio)
- Add Agora credentials to test real streaming

---

## Cost Breakdown

| Service | Limit | Cost |
|---------|-------|------|
| Supabase | 500MB DB | **FREE** |
| Agora.io | 10,000 min/month | **FREE** |
| Vercel | 100GB/month bandwidth | **FREE** |
| **Total** | Full platform | **$0** |

Scale when you grow:
- Supabase: +$25/mo for extra storage
- Agora.io: +$0.40/min for overages
- Vercel: +$20/mo for higher tier

---

## Next Steps

1. ✅ Complete the 5-minute setup above
2. Test artist broadcast flow
3. Test listener discovery flow
4. Read `ARCHITECTURE.md` for full technical details
5. Read `API_SPEC.md` for API documentation
6. Deploy to Vercel/Netlify
7. Share with friends!

---

## Need Help?

- **Architecture questions** → Read `ARCHITECTURE.md`
- **API questions** → Read `API_SPEC.md`
- **Design customization** → Edit `client/global.css`
- **New features** → Check code comments in pages/

---

## Tech Stack at a Glance

```
Frontend: React 18 + TypeScript + Tailwind CSS
Backend: Express.js + Node.js
Streaming: Agora RTC SDK
Auth/DB: Supabase (PostgreSQL + Auth)
Hosting: Vercel/Netlify (optional)

Total Setup Time: 5 minutes
Total Cost: $0/month
```

Enjoy! 🎵
