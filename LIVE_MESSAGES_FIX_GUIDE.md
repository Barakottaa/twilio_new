# Live Messages Fix Guide

## What Was Fixed

### 1. **SSE Route Configuration** ✅
**File**: `src/app/api/events/route.ts`

**Problem**: The SSE endpoint was missing runtime configuration, causing the edge runtime to buffer the stream and prevent real-time message delivery.

**Fix**: Added these two lines at the top of the file:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**Why**: Next.js 13+ defaults to edge runtime which buffers ReadableStreams. The Node.js runtime allows proper SSE streaming.

### 2. **Improved SSE Connection Logging** ✅
**File**: `src/hooks/use-realtime-messages.ts`

**Fix**: Enhanced logging to show connection state transitions:
```typescript
setTimeout(() => {
  if (eventSource.readyState === EventSource.OPEN) {
    console.log('✅ SSE connection confirmed as OPEN after 100ms');
  } else if (eventSource.readyState === EventSource.CONNECTING) {
    console.log('⏳ SSE connection still CONNECTING after 100ms');
  } else {
    console.log('❌ SSE connection CLOSED after 100ms');
  }
}, 100);
```

---

## How to Test the Fixes

### Step 1: Restart the Development Server

**IMPORTANT**: You MUST restart the dev server for the changes to take effect.

1. Stop the current dev server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 2: Run Automated Tests

Run the test script to verify SSE is working:
```bash
node test-sse-complete.js
```

**Expected output**:
```
✅ PASS - SSE Connection
✅ PASS - Connection Count
✅ PASS - Webhook Endpoint
```

### Step 3: Test in Browser

1. Open browser to `http://localhost:3000`
2. Log in with your credentials
3. Open Browser Console (F12)
4. Look for these messages:

   **✅ Good signs**:
   ```
   🔌 Creating new EventSource connection to /api/events
   ✅ SSE connection opened successfully
   ✅ SSE connection confirmed as OPEN after 100ms
   💓 SSE heartbeat received (every 10 seconds)
   ```

   **❌ Bad signs**:
   ```
   ❌ SSE connection error
   ⏳ SSE connection still CONNECTING after 100ms (stays forever)
   ❌ SSE connection CLOSED
   ```

### Step 4: Test Real-Time Message Delivery

1. Keep the browser console open
2. Send a WhatsApp message to your Twilio number
3. Watch for these logs:

   **Server logs** (in dev server terminal):
   ```
   🔔 CONVERSATION EVENTS WEBHOOK CALLED
   📨 Processing message added event...
   📡 Broadcasting newMessage to 1 connections
   ✅ Message sent to connection: conn_xxxxx
   ```

   **Browser logs**:
   ```
   📨 New message via SSE: {conversationSid: "CH...", body: "your message"}
   🔥 handleNewMessage CALLED with: ...
   🔥 Appending new message...
   🔥 Message appended to store successfully
   ```

4. The message should appear in the chat window **immediately** without refreshing

---

## Troubleshooting

### Issue: SSE Test Fails with "Invalid content type"

**Cause**: Dev server is still running old code.

**Solution**: 
1. Completely stop the dev server
2. Wait 3 seconds
3. Start it again
4. Wait for "compiled successfully" message
5. Run tests again

### Issue: SSE Connection Shows as CONNECTING Forever

**Symptoms**:
- Browser console shows `⏳ SSE connection still CONNECTING`
- No "SSE connection opened successfully" message

**Possible Causes**:
1. **Dev server not restarted** - Changes didn't load
2. **Port conflict** - Another process is using port 3000
3. **Reverse proxy issue** - nginx/IIS buffering the stream

**Solutions**:
1. Restart dev server completely
2. Check if port 3000 is available: `netstat -ano | findstr :3000`
3. Try a different port: `npm run dev -- -p 3001`

### Issue: Webhook Not Reaching Server

**Symptoms**:
- No "CONVERSATION EVENTS WEBHOOK CALLED" logs
- Messages don't appear in real-time

**Possible Causes**:
1. **Ngrok/tunnel not running** - Twilio can't reach your server
2. **Wrong webhook URL** - Check Twilio Console

**Check Webhook URL**:
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: Messaging > Services > [Your Service] > Webhooks
3. Verify "Post-Event URL" is set to: `https://your-ngrok-url.ngrok.io/api/twilio/conversations-events`

**Test Webhook**:
```bash
# From server terminal
node test-sse-complete.js
```

Look for: `✅ PASS - Webhook Endpoint`

### Issue: Message Appears in Database But Not in UI

**Symptoms**:
- Webhook logs show message was processed
- Broadcast logs show "Broadcasting newMessage to 0 connections"

**Cause**: No SSE connections active (browser not connected)

**Solution**:
1. Check browser console for SSE connection errors
2. Make sure you're logged in and on a chat page
3. Refresh the page and check if connection establishes

### Issue: Duplicate Messages

**Symptoms**:
- Messages appear twice in chat
- Console shows "Duplicate message detected, skipping"

**Cause**: Both webhook and polling/manual refresh adding the same message

**This is normal**: The duplicate detection is working correctly. The message should only appear once in the UI.

---

## How the Real-Time System Works

```
WhatsApp Message
       ↓
  Twilio Service
       ↓
  Webhook → /api/twilio/conversations-events
       ↓
  broadcastMessage('newMessage', data)
       ↓
  SSE Stream → /api/events
       ↓
  Browser EventSource
       ↓
  useRealtimeMessages hook
       ↓
  handleNewMessage()
       ↓
  Chat Store (appendMessage)
       ↓
  UI Updates (message appears)
```

### Key Points:
1. **Webhook receives message** from Twilio (requires public URL via ngrok)
2. **Broadcast** sends it to all connected SSE clients
3. **Browser receives** via EventSource and updates UI
4. **No polling** - messages appear instantly via push

---

## Verification Checklist

Before testing live messages, verify:

- [ ] Dev server restarted after code changes
- [ ] SSE test passes (run `node test-sse-complete.js`)
- [ ] Browser console shows SSE connection opened
- [ ] Heartbeat messages appear every 10 seconds
- [ ] Ngrok/tunnel is running and accessible
- [ ] Twilio webhook URL is correct and pointing to tunnel
- [ ] You're logged in to the application
- [ ] You're on a conversation/chat page (not login page)

---

## Testing Commands

```bash
# 1. Install test dependencies
npm install --save-dev eventsource

# 2. Run SSE connection test
node test-sse-complete.js

# 3. Test webhook endpoint directly
curl -X POST http://localhost:3000/api/twilio/conversations-events \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "EventType=onMessageAdded&ConversationSid=CH_test&MessageSid=IM_test&Body=Test&Author=whatsapp:+1234567890"

# 4. Check SSE headers
curl -I http://localhost:3000/api/events
# Should show: Content-Type: text/event-stream
```

---

## Next Steps

Once everything is working:

1. **Monitor for a day** - Make sure messages continue to arrive
2. **Test edge cases**:
   - Send message when browser is closed
   - Send message then open browser (should see message)
   - Multiple browser tabs (all should receive)
   - Reconnection after network disconnect
3. **Production deployment**:
   - Ensure runtime config is deployed
   - Set up proper webhook URLs (no ngrok)
   - Monitor SSE connection counts
   - Set up alerts for failed webhooks

---

## Support

If messages still don't appear in real-time after following this guide:

1. Share the **complete output** of `node test-sse-complete.js`
2. Share **browser console logs** (all messages, especially SSE-related)
3. Share **server terminal logs** when sending a test message
4. Confirm your Twilio webhook configuration

