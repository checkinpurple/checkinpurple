# SoundSync API Specification

## Overview

This document defines all APIs needed for SoundSync to function. The app uses a hybrid approach:
- **Agora.io** for real-time audio streaming (free tier)
- **Supabase** for authentication and database
- **Express.js** backend for token generation and stream management

---

## Authentication Flow

### 1. Sign Up (Supabase Auth)
```typescript
const { error } = await supabase.auth.signUp({
  email: 'artist@example.com',
  password: 'secure_password',
  options: {
    data: {
      username: 'artist_name',
      role: 'artist' // or 'fan'
    }
  }
});
```

### 2. Sign In (Supabase Auth)
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: 'artist@example.com',
  password: 'secure_password'
});
```

### 3. Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

---

## Backend API Routes

All backend routes are prefixed with `/api/`

### Agora Token Generation

**Endpoint:** `POST /api/agora/token`

**Purpose:** Generate Agora RTC token for real-time audio streaming

**Request:**
```json
{
  "channelName": "sound_stream_123",
  "uid": 12345
}
```

**Response:**
```json
{
  "token": "agora_rtc_token_...",
  "channelName": "sound_stream_123",
  "uid": 12345
}
```

**Error Response:**
```json
{
  "error": "Token generation failed"
}
```

**Notes:**
- Called when artist clicks "Go Live"
- Token is time-limited (expires after ~24 hours)
- UID can be user ID or random number

---

### Stream Management

#### Create Stream
**Endpoint:** `POST /api/streams`

**Purpose:** Initialize a new live broadcast session

**Request:**
```json
{
  "userId": "user_uuid",
  "title": "My Epic Music Session"
}
```

**Response:**
```json
{
  "success": true,
  "stream": {
    "id": "stream_1234567890",
    "channelName": "sound_stream_1234567890",
    "title": "My Epic Music Session"
  }
}
```

**Status Codes:**
- `200` - Stream created successfully
- `400` - Missing userId or title
- `500` - Server error

---

#### Get All Active Streams
**Endpoint:** `GET /api/streams`

**Purpose:** List all currently live streams (for listener discovery)

**Response:**
```json
{
  "success": true,
  "streams": [
    {
      "id": "stream_123",
      "title": "Jazz Night",
      "listenerCount": 45,
      "startedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "stream_456",
      "title": "Electronic Beats",
      "listenerCount": 120,
      "startedAt": "2024-01-15T10:25:00Z"
    }
  ],
  "total": 2
}
```

---

#### Get Stream Details
**Endpoint:** `GET /api/streams/:streamId`

**Purpose:** Fetch details about a specific stream

**Response:**
```json
{
  "success": true,
  "stream": {
    "id": "stream_123",
    "title": "Jazz Night",
    "channelName": "sound_stream_123",
    "listenerCount": 45,
    "startedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `200` - Stream found
- `404` - Stream not found
- `500` - Server error

---

#### Update Listener Count
**Endpoint:** `POST /api/streams/:streamId/listeners`

**Purpose:** Update real-time listener count (called periodically)

**Request:**
```json
{
  "count": 45
}
```

**Response:**
```json
{
  "success": true,
  "listenerCount": 45
}
```

**Status Codes:**
- `200` - Count updated
- `404` - Stream not found
- `500` - Server error

---

#### End Stream (Auto Cache Clear)
**Endpoint:** `DELETE /api/streams/:streamId`

**Purpose:** Terminate stream and clear all cached audio

**Response:**
```json
{
  "success": true,
  "message": "Stream ended and cache cleared"
}
```

**What Happens:**
1. Stream marked as "ended" in database
2. All Agora RTC connections closed
3. Audio buffers cleared from memory
4. Listener counts reset to 0
5. No audio remains on server or client

**Status Codes:**
- `200` - Stream ended successfully
- `404` - Stream not found
- `500` - Server error

---

## Frontend Integration Points

### 1. Broadcast Page (`client/pages/Broadcast.tsx`)

**Flow:**
```
User clicks "Go Live"
  ↓
POST /api/streams { userId, title }
  ↓
Get streamId + channelName
  ↓
POST /api/agora/token { channelName, uid }
  ↓
Get Agora token
  ↓
Initialize Agora RTC client
  ↓
Join Agora channel
  ↓
Publish audio stream
  ↓
Poll GET /api/streams/:streamId (listener count)
  ↓
User clicks "Stop Stream"
  ↓
DELETE /api/streams/:streamId
  ↓
Leave Agora channel + clear cache
```

### 2. Listen Page (`client/pages/Listen.tsx`)

**Flow:**
```
Page loads
  ↓
GET /api/streams (list active streams)
  ↓
Display streams
  ↓
User clicks stream
  ↓
GET /api/streams/:streamId (get channel name)
  ↓
POST /api/agora/token { channelName, uid }
  ↓
Get Agora token
  ↓
Initialize Agora RTC client
  ↓
Join Agora channel (receive only)
  ↓
Listen to audio stream
  ↓
User leaves
  ↓
Leave Agora channel
```

---

## Data Models

### User
```typescript
interface User {
  id: string;              // UUID from Supabase Auth
  email: string;
  username: string;
  role: 'artist' | 'fan';
  avatar_url?: string;
  created_at: string;      // ISO timestamp
}
```

### Stream
```typescript
interface Stream {
  id: string;              // "stream_" + timestamp
  user_id: string;         // Artist UUID
  title: string;
  description?: string;
  status: 'live' | 'ended';
  listener_count: number;
  started_at: string;      // ISO timestamp
  ended_at?: string;       // ISO timestamp (when stream ends)
  agora_channel: string;   // "sound_" + streamId
}
```

### Track (For future archive)
```typescript
interface Track {
  id: string;
  user_id: string;         // Artist UUID
  title: string;
  duration: number;        // in seconds
  created_at: string;      // ISO timestamp
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid params) |
| 401 | Unauthorized (user not logged in) |
| 404 | Not found (stream/user doesn't exist) |
| 500 | Server error |

---

## Rate Limiting (Future)

For production deployment:
- Agora token generation: 10 req/min per user
- Stream creation: 1 per user at a time
- Listener updates: 1 req/sec per stream
- Endpoint default: 100 req/min per IP

---

## Security Considerations

### 1. Token Generation
- Tokens expire after ~24 hours
- New token needed when joining stream
- User ID validated on backend

### 2. Stream Ownership
- Only stream creator can end stream
- Future: Add authorization check in DELETE endpoint

### 3. Data Privacy
- User passwords hashed by Supabase
- Audio never stored (stream-only)
- Cache cleared when stream ends
- User data isolated by user_id

### 4. Anti-Recording
- Agora RTC protocol doesn't allow download
- No save/export buttons in UI
- Stream data not accessible after stream ends

---

## Testing the APIs

### With cURL

**Create Stream:**
```bash
curl -X POST http://localhost:8080/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "title": "Test Stream"
  }'
```

**Get Streams:**
```bash
curl http://localhost:8080/api/streams
```

**Generate Token:**
```bash
curl -X POST http://localhost:8080/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{
    "channelName": "test_channel",
    "uid": 12345
  }'
```

**End Stream:**
```bash
curl -X DELETE http://localhost:8080/api/streams/stream_123
```

---

## Future Enhancements

1. **Webhooks** - Notify external systems when stream starts/ends
2. **Analytics** - Track listener metrics, stream duration
3. **Recordings** - Optional stream recording (with artist consent)
4. **Monetization** - Tips, subscriptions, donations
5. **Social** - Follow artists, comments during stream
6. **Advanced Agora** - Multiple artists, mixing, recording
