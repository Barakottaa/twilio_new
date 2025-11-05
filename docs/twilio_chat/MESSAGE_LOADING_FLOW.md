# Message Loading Flow - Detailed Explanation

## Overview
Messages are loaded in a **two-tier system**: Database first (fast), then Twilio API fallback (authoritative).

## Complete Flow Diagram

```
User selects conversation
    ↓
useMessages hook (hooks/use-messages.ts)
    ↓
API Call: GET /api/twilio/messages?conversationId=CHxxx&limit=25
    ↓
listMessages() function (lib/twilio-service.ts)
    ↓
┌─────────────────────────────────────┐
│ STEP 1: Try Database First          │
│ (Fast, local storage)                │
└─────────────────────────────────────┘
    │
    ├─► Query SQLite database
    │   SELECT * FROM messages 
    │   WHERE conversation_id = ?
    │   ORDER BY created_at DESC
    │   LIMIT 25
    │
    ├─► If found: Return messages
    │   └─► Parse media data from JSON
    │   └─► Map to Message format
    │   └─► Reverse array (oldest first)
    │
    └─► If NOT found: Fallback to Twilio
        │
┌─────────────────────────────────────┐
│ STEP 2: Twilio API Fallback         │
│ (Authoritative source)               │
└─────────────────────────────────────┘
    │
    ├─► Fetch from Twilio Conversations API
    │   conversations.v1.conversations(conversationId)
    │   .messages.page({ limit: 25 })
    │
    ├─► Process each message:
    │   ├─► Extract media attachments
    │   ├─► Determine sender type (agent/customer)
    │   ├─► Parse message body
    │   └─► Map to Message format
    │
    └─► Return messages with pagination token
```

## Detailed Step-by-Step Process

### 1. User Action: Select Conversation
**Location**: `components/chat/optimized-chat-layout.tsx`

```typescript
const {
  messages,
  isLoading,
  hasMore,
  loadOlder,
  refresh
} = useMessages(selectedConversationId || undefined);
```

### 2. useMessages Hook
**Location**: `hooks/use-messages.ts`

**What it does**:
- Subscribes to messages from chat store
- Fetches messages when conversation changes
- Handles pagination (load older messages)
- Manages loading states

**Key Code**:
```typescript
const fetchMessages = async (before?: string, append = false) => {
  const url = new URL('/api/twilio/messages', window.location.origin);
  url.searchParams.set('conversationId', conversationId);
  url.searchParams.set('limit', '25');  // Default: 25 messages
  if (before) url.searchParams.set('before', before);  // Pagination
  
  const response = await fetch(url.toString());
  const data = await response.json();
  
  // Store in Zustand store
  setMessages(conversationId, data.messages);
};
```

### 3. API Route Handler
**Location**: `app/api/twilio/messages/route.ts`

**What it does**:
- Receives request with `conversationId`
- Calls `listMessages()` function
- Returns JSON response with messages

**Parameters**:
- `conversationId` (required) - Twilio conversation SID
- `limit` (optional, default: 25) - Number of messages to fetch
- `before` (optional) - Pagination token for older messages

### 4. listMessages Function
**Location**: `lib/twilio-service.ts` (line 347)

**Two-Tier Loading Strategy**:

#### Tier 1: Database (SQLite) - Fast & Local
```typescript
// Query local database
const dbMessages = db.prepare(`
  SELECT * FROM messages 
  WHERE conversation_id = ? 
  ORDER BY created_at DESC 
  LIMIT ?
`).all(conversationId, limit);

// Process messages:
// - Parse media data from JSON
// - Map to Message type
// - Reverse array (oldest first)
```

**Benefits**:
- ⚡ Fast (local database)
- 💾 Offline access
- 📊 Can query historical data

**Limitations**:
- Only has messages stored in database
- May miss recent messages not yet synced

#### Tier 2: Twilio API - Authoritative Source
```typescript
// Fallback to Twilio if database fails or empty
const client = await getTwilioClient();
const convo = client.conversations.v1.conversations(conversationId);
const page = await convo.messages.page({ limit: 25 });

// Process each Twilio message:
// - Extract attachedMedia array
// - Determine sender (agent vs customer)
// - Map to Message format
```

**Benefits**:
- ✅ Authoritative source (always up-to-date)
- 📱 Includes all messages from Twilio
- 🔄 Real-time data

**Limitations**:
- Slower (API call)
- Requires internet connection

### 5. Message Processing

#### Database Messages
```typescript
{
  id: msg.id,                    // Internal ID
  text: msg.content,             // Message text
  timestamp: msg.created_at,     // ISO timestamp
  sender: msg.sender_type,       // 'agent' | 'customer'
  senderId: msg.sender_id,      // User identity
  deliveryStatus: 'sent',        // Delivery status
  twilioMessageSid: msg.twilio_message_sid,
  media: [...],                  // Media array
}
```

#### Twilio API Messages
```typescript
{
  id: msg.sid,                   // Twilio message SID
  text: msg.body,                // Message body
  timestamp: msg.dateCreated,     // ISO timestamp
  sender: isAgentMessage ? 'agent' : 'customer',
  senderId: msg.author,          // Author identity
  media: msg.attachedMedia,      // Media attachments
}
```

### 6. Message Storage & Display

**Storage**: Zustand store (`store/chat-store.ts`)
```typescript
messages: Record<string, Message[]>  // conversationId -> messages[]
```

**Display**: Message list component
- Messages sorted oldest → newest
- Virtual scrolling for performance
- Real-time updates via SSE

## Pagination

### Loading Older Messages
```typescript
// When user scrolls to top
loadOlder() {
  fetchMessages(nextBefore, true);  // append = true
  // Prepend older messages to existing array
}
```

**Flow**:
1. User scrolls to top of message list
2. `loadOlder()` called
3. Fetches with `before` token (from previous response)
4. Prepends older messages to current list
5. Updates `hasMore` flag

## Real-Time Updates

**Location**: `hooks/use-realtime-messages.ts`

**How it works**:
- Server-Sent Events (SSE) connection
- Receives new messages as they arrive
- Adds to store automatically
- Deduplicates with existing messages

## Key Features

### 1. Caching
- Database serves as cache
- Reduces Twilio API calls
- Faster initial load

### 2. Fallback Strategy
- Always tries database first
- Falls back to Twilio if needed
- Ensures messages always load

### 3. Pagination
- Loads 25 messages at a time
- Supports "load more" for older messages
- Uses Twilio page tokens

### 4. Media Handling
- Extracts media from `attachedMedia` array
- Supports multiple media per message
- Reconstructs media URLs

### 5. Sender Detection
```typescript
// Agent detection logic
const isAgentMessage = senderIdentity && (
  senderIdentity.startsWith('agent-') || 
  senderIdentity.startsWith('agent_') ||
  senderIdentity === loggedInAgentId ||
  senderIdentity === 'admin_001'
);
```

## Performance Optimizations

1. **Database First**: Fast local queries
2. **Caching**: Message cache (5 minutes TTL)
3. **Pagination**: Load only what's needed
4. **Virtual Scrolling**: Render only visible messages
5. **Deduplication**: Prevent duplicate messages in store

## API Endpoints

### GET /api/twilio/messages
**Query Parameters**:
- `conversationId` (required) - Conversation SID
- `limit` (optional, default: 25) - Number of messages
- `before` (optional) - Pagination token

**Response**:
```json
{
  "success": true,
  "messages": [...],
  "nextBefore": "token",
  "hasMore": true
}
```

## Data Flow Summary

```
Conversation Selection
    ↓
useMessages Hook
    ↓
API: /api/twilio/messages
    ↓
listMessages() Function
    ↓
┌─────────────────┬─────────────────┐
│   Database      │   Twilio API    │
│   (Tier 1)      │   (Tier 2)      │
└─────────────────┴─────────────────┘
    ↓
Message Processing
    ↓
Zustand Store
    ↓
UI Components
    ↓
Message Display
```

## Current Behavior

1. **Initial Load**: Fetches 25 most recent messages
2. **Load More**: Fetches older messages when scrolling up
3. **Real-Time**: New messages added via SSE
4. **Database Priority**: Database checked first, then Twilio
5. **Media Support**: Handles images, videos, documents

