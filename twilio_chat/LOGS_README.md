# Server Logs Location

## Log File Location

Server logs are stored in the `logs/` directory at the root of your project:

```
twilio_new/
  └── logs/
      └── server-YYYY-MM-DD.log
```

**Full path example:**
```
D:\New folder\twilio_new\twilio_chat\logs\server-2025-01-06.log
```

## Log File Format

- **File naming:** `server-YYYY-MM-DD.log` (one file per day)
- **Format:** JSON lines (one JSON object per line)
- **Content:** All Twilio webhook requests, message processing, and server events

## How to View Logs

### Windows (PowerShell)
```powershell
# View today's log file
Get-Content logs\server-$(Get-Date -Format "yyyy-MM-dd").log -Tail 50 -Wait

# Or use tail equivalent
Get-Content logs\server-$(Get-Date -Format "yyyy-MM-dd").log -Wait
```

### Windows (Command Prompt)
```cmd
# View today's log (requires PowerShell or install tail for Windows)
type logs\server-2025-01-06.log
```

### Using a Text Editor
Simply open the log file in any text editor:
- Notepad
- VS Code
- Notepad++

## What Gets Logged

### 1. Twilio Webhook Requests
- **Conversations-Events webhook** - All incoming messages
- **Message-Status webhook** - Delivery status updates
- **Full request data** including:
  - `ProfileName` (critical for contact names)
  - `Author` (phone number)
  - `Body` (message content)
  - `ConversationSid`
  - `MessageSid`
  - All other Twilio parameters

### 2. Message Processing
- When messages are received
- When ProfileName is missing (warnings)
- When ProfileName is found (success)
- Message broadcasting via SSE

### 3. Contact Name Issues
- Warnings when `ProfileName` is missing
- Logs showing why contact names aren't displaying

## Example Log Entry

```json
{
  "timestamp": "2025-01-06T15:30:45.123Z",
  "level": "INFO",
  "message": "📨 Twilio Webhook Received: Conversations-Events",
  "data": {
    "type": "Conversations-Events",
    "timestamp": "2025-01-06T15:30:45.123Z",
    "params": {
      "ConversationSid": "CH...",
      "MessageSid": "IM...",
      "Author": "whatsapp:+201234567890",
      "ProfileName": "John Doe",
      "Body": "Hello",
      ...
    },
    "conversationSid": "CH...",
    "messageSid": "IM...",
    "author": "whatsapp:+201234567890",
    "profileName": "John Doe",
    "body": "Hello"
  }
}
```

## Troubleshooting Contact Names

When a contact name is not showing, check the logs for:

1. **Look for this warning:**
   ```json
   {
     "level": "WARN",
     "message": "⚠️ ProfileName is MISSING or EMPTY - Contact name will not be available"
   }
   ```

2. **Check if ProfileName exists in the webhook:**
   - Search for `"profileName"` in the log file
   - If it's `"(MISSING)"` or empty, Twilio didn't send it

3. **Verify the broadcast includes ProfileName:**
   - Look for `"📡 Broadcasting message via SSE"`
   - Check if `hasProfileName: true` or `false`

## Log Rotation

- Logs are automatically rotated daily
- Each day gets a new file: `server-YYYY-MM-DD.log`
- Old log files are kept (not automatically deleted)

## Log Levels

- **INFO** 📝 - Normal operations
- **WARN** ⚠️ - Missing data or potential issues
- **ERROR** ❌ - Errors that need attention
- **DEBUG** 🔍 - Detailed debugging information

