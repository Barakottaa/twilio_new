# 🔍 Webhook Debugging Guide

## Current Status
✅ App loads correctly
✅ Messages load from database  
✅ SSE connection healthy
❌ Real-time messages NOT working

## Root Cause
**Twilio is NOT calling your webhook** when new messages arrive!

## Why This Happens
You're running on `localhost` (26.26.124.56:3000), but Twilio can't reach localhost URLs.

## Solutions

### Option 1: Use ngrok (Recommended for Testing)

1. **Install ngrok** (if not installed):
   ```bash
   # Download from https://ngrok.com/download
   # Or use: choco install ngrok (Windows)
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Update Twilio Webhook**:
   - Go to: https://console.twilio.com/us1/develop/conversations/manage/services
   - Click your Conversation Service
   - Go to "Webhooks"
   - Set "Post-Event URL" to: `https://abc123.ngrok.io/api/twilio/conversations-events`
   - Enable: `onMessageAdded`, `onConversationAdded`, `onParticipantAdded`
   - Save

5. **Test**: Send a WhatsApp message - it should appear in real-time!

### Option 2: Deploy to Production
If you have a production URL, update the webhook to point there.

### Option 3: Check if Webhook is Already Configured
Run this to see current webhook:
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.conversations.v1
  .services('YOUR_CHAT_SERVICE_SID')
  .fetch()
  .then(service => {
    console.log('Post Webhook URL:', service.postWebhookUrl);
    console.log('Webhook Method:', service.webhookMethod);
  });
```

## How to Verify Webhook is Working

After setting up ngrok, watch the server logs. When you send a WhatsApp message, you should see:

```
🔔 CONVERSATION EVENTS WEBHOOK CALLED - Starting processing...
📋 Conversation events webhook parameters: {...}
🎯 Event Type: onMessageAdded
📨 New message added via conversation events
📡 Broadcasting message to clients...
✅ Message broadcasted to UI with 0 media items
```

And in the browser console:
```
📨 New message via SSE: {...}
📨 Message details: {...}
📨 Calling handleNewMessage...
```

## Quick Test Without Webhook

To test if the UI works, you can manually trigger SSE by opening this in your browser:
```
http://26.26.124.56:3000/api/events
```

You should see heartbeat messages every 30 seconds.

