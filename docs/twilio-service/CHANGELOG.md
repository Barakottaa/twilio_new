# Changelog - Twilio Conversations API Migration

## [2.0.0] - Conversations API Implementation

### Changed
- **BREAKING**: Now uses Twilio Conversations API instead of Messaging API
- All messages are now sent through conversations
- Templates are associated with conversations via `conversationSid`

### Added
- `findOrCreateConversation(phoneNumber)` - Automatically manages conversations
- Conversation caching (5-minute TTL)
- `getConversation(phoneNumber)` - Get conversation without creating
- System identity support (`TWILIO_SYSTEM_IDENTITY` env var)

### Updated Methods
- `sendMessage()` - Now uses `conversations.v1.conversations().messages.create()`
- `sendTemplateMessage()` - Now includes `conversationSid` in messages.create()
- `sendImageMessageByUrl()` - Now includes `conversationSid` in messages.create()
- `testConnection()` - Now tests Conversations API access

### Benefits
- ✅ Better conversation context
- ✅ Message threading
- ✅ Participant management
- ✅ Ready for multi-agent support
- ✅ Better message history

### Migration Guide
No code changes needed! All method signatures remain the same. The service automatically:
- Creates conversations when needed
- Associates messages with conversations
- Manages participants

### Environment Variables
Optional:
```env
TWILIO_SYSTEM_IDENTITY=system  # Identity for system messages
```

### Performance
- First message: Slightly slower (conversation creation)
- Subsequent messages: Faster (uses cached conversation)
- Cache reduces API calls significantly

### Backward Compatibility
✅ All existing code continues to work
✅ No breaking changes to public API
✅ Automatic conversation management

