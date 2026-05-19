# SoundSync Production Setup Guide

## 1. Set Up Supabase

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Fill in project details:
   - Name: `soundsync`
   - Database Password: Choose a strong password
   - Region: Select closest to your users
4. Wait for project creation (2-3 minutes)

### Get Credentials
1. Go to Settings → API
2. Copy:
   - **Project URL**
   - **Anon public key**

### Create Database Tables
1. Go to SQL Editor in Supabase dashboard
2. Copy and paste the contents of `database/schema.sql`
3. Click "Run" to execute

### Update Environment Variables
Create `.env.local` in your project root:
```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 2. Set Up Agora.io

### Create Agora Account
1. Go to [console.agora.io](https://console.agora.io) and sign up (free)
2. Verify your email

### Create Project
1. Click "Project Management" → "Create Project"
2. Project Name: `soundsync`
3. Use Case: `Interactive Live Streaming`
4. Click "Submit"

### Get Credentials
1. Go to Project Management
2. Click on your project
3. Copy:
   - **App ID**
   - **App Certificate** (click "Enable" if needed)

### Update Environment Variables
Add to `.env.local`:
```bash
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here
```

## 3. Test the Setup

### Start Development Server
```bash
pnpm dev
```

### Test Authentication
1. Go to `http://localhost:8080`
2. Click "Create Artist Account"
3. Sign up with email/password
4. Should redirect to broadcast page

### Test Streaming (with Agora)
1. On broadcast page, enter stream title
2. Click "Go Live"
3. Should create stream and show live interface

### Test Listening
1. Open new browser tab
2. Go to `http://localhost:8080/listen`
3. Should show live streams from database

## 4. Deploy to Vercel

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy
```bash
vercel
```
Follow the prompts:
- Link to existing project or create new
- Set environment variables (copy from .env.local)
- Deploy

### Update Supabase CORS
In Supabase dashboard:
1. Go to Settings → API
2. Add your Vercel domain to "Allowed Origins"

## Troubleshooting

### Common Issues

**Auth not working:**
- Check Supabase URL and keys in .env.local
- Make sure tables were created correctly

**Streaming not working:**
- Check Agora App ID and Certificate
- Make sure environment variables are set

**Database errors:**
- Check SQL execution in Supabase
- Verify RLS policies

**Build errors:**
- Make sure all dependencies are installed
- Check TypeScript errors

### Environment Variables Checklist
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] AGORA_APP_ID
- [ ] AGORA_APP_CERTIFICATE

## Next Steps
- Add user profiles with avatars
- Implement real-time listener counts
- Add stream categories/genres
- Implement Agora RTC for actual audio streaming
- Add stream recording prevention
- Deploy to production