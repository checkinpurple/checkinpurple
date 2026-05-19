# SoundSync - Live Music Streaming Platform

A modern, production-ready live music streaming app where artists broadcast music from their phone storage and listeners enjoy live performances. **Zero upfront costs** using free-tier Supabase and Agora.io.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38b2ac)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.0-90c53f)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)
[![Agora](https://img.shields.io/badge/Agora-RTC-0055ff)](https://agora.io/)

---

## 🎵 Features

### For Artists
- 🎤 **Stream Live** - Broadcast from phone storage in real-time
- 🔒 **Auto Cache Clear** - Audio deleted when stream ends (100% privacy)
- 👥 **Real-time Listeners** - Watch audience count live
- 🎯 **Easy Controls** - Go live, mute, share with one click
- 🌍 **Global Reach** - Stream to listeners worldwide

### For Listeners
- 🔍 **Discover Streams** - Browse live broadcasts in real-time
- 🎵 **Stream Only** - Listen without ability to record/download
- 👍 **Like Streams** - Favorite your favorite artists
- 🔍 **Filter by Genre** - Jazz, Electronic, Hip Hop, Acoustic, Classical, Rock
- 📱 **Mobile Optimized** - Works on phones, tablets, desktops

### Security & Privacy
- 🔐 **Anti-Recording** - Agora RTC protocol prevents download/recording
- 🛡️ **No Data Storage** - Audio never persisted to disk
- 🔑 **Encrypted Auth** - Email/password with Supabase
- 📊 **Zero Tracking** - No analytics on private streams

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free)
- 5 minutes

### Setup

```bash
# 1. Clone & install
git clone <repo>
cd soundsync
pnpm install

# 2. Create .env.local with Supabase credentials
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# 3. Run dev server
pnpm dev

# 4. Open http://localhost:8080
```

**Done!** Sign up as artist or listener and start streaming.

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Broadcast Page         │         Listen Page                │
│  - Go Live             │  - Discover Streams                │
│  - Mute/Unmute         │  - Join Stream                     │
│  - Settings            │  - Real-time Playback             │
└──────────────┬──────────┴────────────────┬────────────────────┘
               │                           │
        ┌──────▼───────┐         ┌─────────▼─────────┐
        │   Agora RTC  │         │   Agora RTC       │
        │   Publisher  │         │   Subscriber      │
        │   (Audio)    │         │   (Audio)         │
        └──────┬───────┘         └─────────┬─────────┘
               │                           │
        ┌──────▼───────────────────────────▼─────┐
        │        Agora Cloud (Real-time)         │
        │  - Audio streaming (no storage)        │
        │  - Sub-second latency                  │
        │  - Anti-recording built-in             │
        └──────┬──────────────────────────────────┘
               │
        ┌──────▼───────────────────┐
        │   Express Backend        │
        │  - Token generation      │
        │  - Stream management     │
        │  - Analytics             │
        └──────┬───────────────────┘
               │
        ┌──────▼──────────────────────────┐
        │   Supabase (Free Tier)          │
        │  - PostgreSQL (auth + data)     │
        │  - Real-time subscriptions      │
        │  - Row-level security           │
        └─────────────────────────────────┘
```

---

## 📁 Project Structure

```
soundsync/
├── client/
│   ├── pages/
│   │   ├── Index.tsx          # Landing page with role selection
│   │   ├── SignUp.tsx         # User registration
│   │   ├── SignIn.tsx         # User login
│   │   ├── Broadcast.tsx      # Artist streaming interface
│   │   ├── Listen.tsx         # Listener discovery & playback
│   │   └── NotFound.tsx       # 404 page
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client + types
│   │   └── auth-context.tsx   # Global auth state
│   ├── components/ui/         # Pre-built UI components
│   ├── App.tsx                # Route definitions
│   ├── global.css             # Tailwind + custom styles
│   └── vite-env.d.ts          # Vite types
│
├── server/
│   ├── routes/
│   │   ├── agora.ts           # Token generation API
│   │   ├── streams.ts         # Stream CRUD APIs
│   │   └── demo.ts            # Example endpoint
│   ├── index.ts               # Express app setup
│   └── vite.config.server.ts  # Vite config
│
├── shared/
│   └── api.ts                 # Shared types
│
├── QUICKSTART.md              # 5-minute setup guide
├── ARCHITECTURE.md            # Full technical documentation
├── API_SPEC.md               # API reference
├── README.md                 # This file
└── package.json              # Dependencies
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Lightning-fast bundler
- **Tailwind CSS 3** - Utility-first styling
- **React Router 6** - SPA routing
- **Lucide React** - Icon library
- **Agora RTC SDK** - Real-time audio

### Backend
- **Express.js** - HTTP server
- **Node.js** - JavaScript runtime
- **Zod** - Input validation
- **CORS** - Cross-origin requests

### Infrastructure
- **Supabase** - PostgreSQL + Auth (free)
- **Agora.io** - RTC streaming (free tier)
- **Vercel/Netlify** - Hosting (optional, free tier)

---

## 🎯 API Endpoints

All endpoints prefixed with `/api/`

### Authentication (Supabase)
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/signout` - Logout user

### Streaming
- `POST /agora/token` - Generate RTC token
- `POST /streams` - Create new stream
- `GET /streams` - List active streams
- `GET /streams/:id` - Get stream details
- `DELETE /streams/:id` - End stream (clears cache)
- `POST /streams/:id/listeners` - Update listener count

See [API_SPEC.md](./API_SPEC.md) for full documentation.

---

## 🔐 Security Features

| Feature | Implementation |
|---------|-----------------|
| **Anti-Recording** | Agora RTC protocol level |
| **No Storage** | Audio streamed, never persisted |
| **Cache Clear** | Automatic on stream end |
| **Auth** | Supabase (email/password + JWT) |
| **Encryption** | TLS/SSL in transit |
| **Privacy** | User data isolated by user_id |

---

## 💰 Cost Breakdown

| Service | Free Tier | Limit | Cost |
|---------|-----------|-------|------|
| Supabase | ✅ | 500MB DB | $0 |
| Agora.io | ✅ | 10,000 min/month | $0 |
| Vercel | ✅ | 100GB bandwidth | $0 |
| **Total** | | Full Platform | **$0/month** |

**Scale later:**
- Supabase: +$25/mo (additional storage)
- Agora.io: ~$0.40/min (overages)
- Vercel: +$20/mo (higher tier)

---

## 🎨 Design System

### Colors (Dark Theme)
- **Background:** hsl(270, 20%, 8%) - Deep purple-black
- **Primary:** hsl(270, 70%, 60%) - Vibrant purple
- **Accent:** hsl(290, 80%, 65%) - Bright pink
- **Text:** hsl(270, 10%, 98%) - Off-white

### Typography
- **Font:** Inter (Google Fonts)
- **Weights:** 400, 500, 600, 700, 900
- **Scale:** 3:4 ratio (mobile-first)

### Components
- **Buttons:** Gradient primary, outline secondary, ghost tertiary
- **Cards:** Glass morphism with backdrop blur
- **Inputs:** Dark background with border focus
- **Modals:** Full-screen overlay with blur

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# 1. Push to GitHub
git push origin main

# 2. Import to Vercel
# vercel.com → New Project → Import Git Repo

# 3. Add environment variables
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY

# Done! Your app is live
```

### Netlify
```bash
pnpm build
# Deploy `dist/spa` folder to Netlify
```

### Docker
```bash
docker build -t soundsync .
docker run -p 8080:8080 soundsync
```

---

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full technical architecture
- **[API_SPEC.md](./API_SPEC.md)** - Complete API reference
- **Code Comments** - Inline explanations throughout

---

## 🔄 Development Workflow

```bash
# Start dev server with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Format code
pnpm format.fix

# Run tests
pnpm test

# Production build
pnpm build

# Start production server
pnpm start
```

---

## 🐛 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
pnpm install
```

### "Supabase URL or Anon Key is missing"
- Add to `.env.local`:
  ```
  VITE_SUPABASE_URL=your_project_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```

### "Broadcast page shows 404"
- Sign up first, then navigate to broadcast
- Check you're logged in (user icon in navbar)

### "Listen page is empty"
- No active streams yet, open another window and go live

### "No audio streaming"
- Mock tokens used by default (for testing)
- Add Agora credentials for real streaming:
  ```
  AGORA_APP_ID=your_app_id
  AGORA_APP_CERTIFICATE=your_app_certificate
  ```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- **Agora.io** - Real-time communication platform
- **Supabase** - Open-source Firebase alternative
- **React** - UI framework
- **Tailwind CSS** - CSS framework
- **Lucide React** - Icon library

---

## 📞 Support

- **Questions?** Check [QUICKSTART.md](./QUICKSTART.md)
- **API help?** See [API_SPEC.md](./API_SPEC.md)
- **Architecture?** Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues?** Check GitHub Issues

---

## 🎯 Roadmap

### v1.0 (Current)
- ✅ User authentication
- ✅ Live streaming (Agora RTC)
- ✅ Auto cache clearing
- ✅ Listener discovery
- ✅ Real-time listener count
- ✅ Anti-recording protection

### v2.0 (Planned)
- [ ] Scheduled streams
- [ ] Stream history
- [ ] Tips/donations
- [ ] Social features (follow, comments)
- [ ] Mobile app (React Native)

### v3.0 (Future)
- [ ] Multi-artist collaboration
- [ ] Stream archiving (optional)
- [ ] Premium features
- [ ] Monetization platform

---

**Built with ❤️ by the SoundSync team**

Happy streaming! 🎵
