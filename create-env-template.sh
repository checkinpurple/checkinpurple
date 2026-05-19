#!/bin/bash
# .env.local Template Creator

# Run this to create a template:
# bash create-env-template.sh

cat > .env.local.template << 'EOF'
# ========================================
# SoundSync Environment Variables
# ========================================

# SUPABASE CREDENTIALS
# Get from: https://supabase.com
#   1. Create project
#   2. Go to Settings → API
#   3. Copy "Project URL"
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Get from: Settings → API → "Anon public" key
# It's a long string starting with eyJ
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# ========================================

# AGORA CREDENTIALS
# Get from: https://console.agora.io
#   1. Create project (soundsync)
#   2. Go to Project Management → your project
#   3. Copy "App ID"
AGORA_APP_ID=abc123def456ghi789jklmnopqrst

# Get from: Project Management → Primary Certificate
# Click "Generate" if not shown
AGORA_APP_CERTIFICATE=abcdefghijklmnopqrstuvwxyz1234567890

# ========================================
# Instructions:
# 1. Go to https://supabase.com and create project
# 2. Go to https://console.agora.io and create project
# 3. Copy credentials above
# 4. Replace "your-..." with actual values
# 5. Save as .env.local in project root
# 6. Run: pnpm dev
# ========================================
EOF

echo "✓ Created: .env.local.template"
echo ""
echo "Next steps:"
echo "1. Copy values to .env.local:"
echo "   cp .env.local.template .env.local"
echo ""
echo "2. Edit .env.local and replace:"
echo "   - your-project-id → your actual Supabase ID"
echo "   - eyJ0eXA... → your actual Anon Key"
echo "   - abc123def... → your actual Agora App ID"
echo "   - abcdef... → your actual Agora Certificate"
echo ""
echo "3. Start dev server:"
echo "   pnpm dev"
echo ""