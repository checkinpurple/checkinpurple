#!/bin/bash
# Backend API Test Script
# Tests all endpoints without credentials

echo "🧪 SoundSync Backend API Test"
echo "=============================="
echo ""

BASE_URL="http://localhost:8080"
DEMO_USER_ID="550e8400-e29b-41d4-a716-446655440001"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Make sure 'pnpm dev' is running in another terminal!"
echo ""

# Test 1: Ping endpoint
echo -e "${YELLOW}Test 1: Ping Endpoint${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/ping")
if echo "$RESPONSE" | grep -q "ping"; then
  echo -e "${GREEN}✓ PASS${NC} - Ping works"
  echo "  Response: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - Ping failed"
  echo "  Is server running?"
fi
echo ""

# Test 2: Create Stream
echo -e "${YELLOW}Test 2: Create Stream${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/streams" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$DEMO_USER_ID\", \"title\": \"Test Stream\"}")

if echo "$RESPONSE" | grep -q "stream"; then
  echo -e "${GREEN}✓ PASS${NC} - Stream created"
  echo "  Response: $RESPONSE"
  # Extract stream ID
  STREAM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Stream ID: $STREAM_ID"
else
  echo -e "${RED}✗ FAIL${NC} - Stream creation failed"
  echo "  Response: $RESPONSE"
  echo "  Check: Is Supabase configured?"
  exit 1
fi
echo ""

# Test 3: List Streams
echo -e "${YELLOW}Test 3: List Active Streams${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/streams")
if echo "$RESPONSE" | grep -q "streams"; then
  echo -e "${GREEN}✓ PASS${NC} - List streams works"
  echo "  Response: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - List streams failed"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 4: Get Stream
echo -e "${YELLOW}Test 4: Get Stream Details${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/streams/$STREAM_ID")
if echo "$RESPONSE" | grep -q "title"; then
  echo -e "${GREEN}✓ PASS${NC} - Get stream works"
  echo "  Response: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - Get stream failed"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 5: Generate Agora Token
echo -e "${YELLOW}Test 5: Generate Agora Token${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/agora/token" \
  -H "Content-Type: application/json" \
  -d "{\"channelName\": \"test_channel\", \"uid\": 123}")

if echo "$RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ PASS${NC} - Agora token generated"
  if echo "$RESPONSE" | grep -q "mock_token"; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Token is MOCK (not real)"
    echo "  Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env.local"
  else
    echo -e "${GREEN}✓ Real token${NC} - Agora configured correctly"
  fi
  echo "  Response length: $(echo "$RESPONSE" | wc -c) chars"
else
  echo -e "${RED}✗ FAIL${NC} - Token generation failed"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 6: Update Listener Count
echo -e "${YELLOW}Test 6: Update Listener Count${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/streams/$STREAM_ID/listeners" \
  -H "Content-Type: application/json" \
  -d "{\"count\": 42}")

if echo "$RESPONSE" | grep -q "listenerCount"; then
  echo -e "${GREEN}✓ PASS${NC} - Listener count updated"
  echo "  Response: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - Update failed"
  echo "  Response: $RESPONSE"
fi
echo ""

# Test 7: End Stream
echo -e "${YELLOW}Test 7: End Stream${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/streams/$STREAM_ID")
if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ PASS${NC} - Stream ended"
  echo "  Response: $RESPONSE"
else
  echo -e "${RED}✗ FAIL${NC} - End stream failed"
  echo "  Response: $RESPONSE"
fi
echo ""

echo "=============================="
echo "✅ Backend API Tests Complete"
echo ""
echo "Summary:"
echo "  If all tests passed ✓"
echo "    → Your backend is working!"
echo "    → Tests with real Agora token?"
echo ""
echo "  If Agora token shows 'mock_token'"
echo "    → Set credentials in .env.local"
echo "    → Restart: pnpm dev"
echo ""
echo "  If Supabase tests failed"
echo "    → Check .env.local credentials"
echo "    → Check database tables created"
echo ""