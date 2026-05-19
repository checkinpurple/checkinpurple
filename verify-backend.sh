#!/bin/bash
# Backend Verification Script

echo "🔍 SoundSync Backend Verification"
echo "=================================="
echo ""

# Check 1: Environment variables
echo "✓ CHECKING ENVIRONMENT:"
if [ -f ".env.local" ]; then
  echo "  ✓ .env.local file found"
  if grep -q "VITE_SUPABASE_URL" .env.local; then
    echo "  ✓ VITE_SUPABASE_URL configured"
  else
    echo "  ✗ VITE_SUPABASE_URL missing"
  fi
  if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo "  ✓ VITE_SUPABASE_ANON_KEY configured"
  else
    echo "  ✗ VITE_SUPABASE_ANON_KEY missing"
  fi
  if grep -q "AGORA_APP_ID" .env.local; then
    echo "  ✓ AGORA_APP_ID configured"
  else
    echo "  ✗ AGORA_APP_ID missing"
  fi
  if grep -q "AGORA_APP_CERTIFICATE" .env.local; then
    echo "  ✓ AGORA_APP_CERTIFICATE configured"
  else
    echo "  ✗ AGORA_APP_CERTIFICATE missing"
  fi
else
  echo "  ✗ .env.local file NOT found"
  echo "  → Create .env.local in project root"
fi

echo ""
echo "✓ CHECKING SERVER FILES:"

# Check server routes
if [ -f "server/routes/agora.ts" ]; then
  echo "  ✓ Agora route found"
else
  echo "  ✗ Agora route missing"
fi

if [ -f "server/routes/streams.ts" ]; then
  echo "  ✓ Streams route found"
else
  echo "  ✗ Streams route missing"
fi

if [ -f "server/lib/supabase.ts" ]; then
  echo "  ✓ Supabase client found"
else
  echo "  ✗ Supabase client missing"
fi

echo ""
echo "✓ CHECKING DATABASE SCHEMA:"

if [ -f "database/schema.sql" ]; then
  echo "  ✓ Database schema found"
  TABLES=$(grep -c "CREATE TABLE" database/schema.sql)
  echo "  ✓ Contains $TABLES table definitions"
else
  echo "  ✗ Database schema missing"
fi

echo ""
echo "✓ CHECKING DEPENDENCIES:"

if grep -q "agora-token" package.json 2>/dev/null; then
  echo "  ✓ agora-token package installed"
else
  echo "  ✗ agora-token package missing"
fi

if grep -q "@supabase/supabase-js" package.json 2>/dev/null; then
  echo "  ✓ @supabase/supabase-js installed"
else
  echo "  ✗ @supabase/supabase-js missing"
fi

echo ""
echo "=================================="
echo "NEXT STEPS:"
echo ""
echo "1. Create .env.local with credentials:"
echo "   VITE_SUPABASE_URL=..."
echo "   VITE_SUPABASE_ANON_KEY=..."
echo "   AGORA_APP_ID=..."
echo "   AGORA_APP_CERTIFICATE=..."
echo ""
echo "2. Run: pnpm dev"
echo ""
echo "3. Test at: http://localhost:8080"
echo ""