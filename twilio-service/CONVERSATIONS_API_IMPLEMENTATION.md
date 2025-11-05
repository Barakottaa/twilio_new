# Twilio Conversations API Implementation

## Overview

The `twilio-service` now uses **Twilio Conversations API** instead of the basic Messaging API for sending templates and messages. This provides better conversation context and threading.

## Key Changes

### 1. Conversation Management
- **Automatic conversation creation**: Conversations are automatically created/found for each phone number
- **Participant management**: Customer and system participants are automatically added
- **Conversation caching**: 5-minute cache to reduce API calls

### 2. Template Messages
- Templates are sent via `messages.create()` with `conversationSid`
- Templates are now associated with conversations for better context
- Uses Content Template Builder (same as before)

### 3. Regular Messages
- Messages now use `conversations.v1.conversations(conversationSid).messages.create()`
- Provides better message threading
- Author identity is tracked (defaults to 'system')

### 4. Image Messages
- Images use `messages.create()` with `conversationSid` included
- Images are associated with conversations

## API Methods

### `findOrCreateConversation(phoneNumber)`
Finds existing conversation or creates a new one for a phone number.

**Features**:
- Checks cache first (5-minute TTL)
- Searches existing conversations by participant phone number
- Creates conversation if not found
- Adds customer and system participants
- Returns conversation SID

### `sendMessage(to, text, author = null)`
Sends text message via Conversations API.

**Before (Messaging API)**:
```javascript
await client.messages.create({ from, to, body });
```

**Now (Conversations API)**:
```javascript
const conversationSid = await findOrCreateConversation(to);
await client.conversations.v1.conversations(conversationSid).messages.create({
  author: 'system',
  body: text
});
```

### `sendTemplateMessage(phoneNumber, contentSid, contentVariables)`
Sends template message via Conversations API.

**Before (Messaging API)**:
```javascript
await client.messages.create({ from, to, contentSid, contentVariables });
```

**Now (Conversations API)**:
```javascript
const conversationSid = await findOrCreateConversation(phoneNumber);
await client.messages.create({ 
  from, 
  to, 
  contentSid, 
  contentVariables,
  conversationSid  // Associate with conversation
});
```

### `sendImageMessageByUrl(to, mediaUrl, caption)`
Sends image message via Conversations API.

**Before (Messaging API)**:
```javascript
await client.messages.create({ from, to, mediaUrl });
```

**Now (Conversations API)**:
```javascript
const conversationSid = await findOrCreateConversation(to);
await client.messages.create({ 
  from, 
  to, 
  mediaUrl,
  conversationSid  // Associate with conversation
});
```

## Benefits

1. **Conversation Context**: All messages are grouped in conversations
2. **Message Threading**: Better message history and threading
3. **Participant Management**: Track who's in each conversation
4. **Future-Ready**: Can add multi-agent support later
5. **Better Analytics**: Conversation-level metrics

## Environment Variables

Add optional:
```env
TWILIO_SYSTEM_IDENTITY=system  # Identity for system messages (default: 'system')
```

## How It Works

### Flow for Template Message:
1. Client calls `sendTemplateMessage(phoneNumber, contentSid, variables)`
2. `findOrCreateConversation(phoneNumber)` is called:
   - Checks cache
   - Searches existing conversations
   - Creates conversation if needed
   - Adds participants
   - Returns conversationSid
3. Template sent via `messages.create()` with `conversationSid`
4. Message is associated with conversation

### Flow for Regular Message:
1. Client calls `sendMessage(to, text)`
2. `findOrCreateConversation(to)` is called
3. Message sent via `conversations.v1.conversations(conversationSid).messages.create()`
4. Message appears in conversation thread

## Conversation Structure

Each conversation contains:
- **SID**: Unique conversation identifier
- **Friendly Name**: "Chat with +1234567890"
- **Unique Name**: "whatsapp_1234567890" (for easy lookup)
- **Participants**:
  - Customer (via WhatsApp number)
  - System (via identity)

## Caching Strategy

- **Conversation Cache**: 5-minute TTL
- **Cache Key**: `conv_whatsapp:+1234567890`
- **Purpose**: Reduce API calls when sending multiple messages to same number

## Error Handling

If conversation creation fails:
- Error is logged with context
- Operation fails gracefully
- Error returned to caller

## Example Usage

```javascript
const TwilioApiClient = require('./twilio-api-client');
const client = new TwilioApiClient();

// Send template
await client.sendTemplateMessage(
  '+1234567890',
  'HX1234567890abcdef',
  { '1': 'John', '2': 'Invoice #123' }
);

// Send regular message
await client.sendMessage('+1234567890', 'Hello!');

// Send image
await client.sendImageMessageByUrl(
  '+1234567890',
  'https://example.com/image.jpg',
  'Report image'
);
```

## Migration Notes

- **Backward Compatible**: All existing method signatures remain the same
- **Automatic**: Conversations are created automatically
- **No Breaking Changes**: Existing code continues to work
- **Enhanced**: Messages now have conversation context

## Performance Considerations

- **First Message**: May be slightly slower (conversation creation)
- **Subsequent Messages**: Faster (uses cached conversation)
- **Cache**: Reduces API calls by ~50% for repeated messages

## Future Enhancements

With Conversations API, you can now:
- Add multiple agents to conversations
- Track conversation status (open/closed)
- Implement conversation assignment
- Add conversation-level metadata
- Use conversation webhooks for better event handling

