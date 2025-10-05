# How to View Server Logs

## Quick Test:

**Send a test WhatsApp message and watch for these logs:**

### ✅ If Webhook is Working:
```
🔔 CONVERSATION EVENTS WEBHOOK CALLED - Starting processing...
📋 Conversation events webhook parameters: {...}
🎯 Event Type: onMessageAdded
📨 New message added via conversation events
🔄 Checking database for messages...
✅ Message stored via conversation events: {...}
📡 Broadcasting message to clients...
📡 BROADCAST MESSAGE CALLED - Type: newMessage
📡 Broadcasting newMessage to 1 connections
✅ Message sent to connection: conn_XXX
✅ Message broadcasted to UI with 0 media items
```

### ❌ If Webhook is NOT Working:
You'll see NOTHING - no logs at all when you send a message.

## To View Logs:

1. **Look in your Windows Taskbar** for a PowerShell window
2. Or press **Alt+Tab** to cycle through open windows
3. Look for the window with "npm" or "Next.js" in the title

## Can't Find the Window?

If you can't find it, the server might have closed. Let me restart it with visible output.

