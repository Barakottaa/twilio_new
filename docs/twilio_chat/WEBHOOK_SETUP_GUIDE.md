# Webhook Setup Guide for Multiple Numbers

## Answer: You DON'T Need Separate Services/Webhooks

### ✅ Recommended Setup: ONE Messaging Service + ONE Webhook URL

## Why One Webhook Works

Since you're using **Twilio Conversations API**, you can use **one webhook URL** that handles all numbers. Here's why:

### 1. Conversations API Webhooks

With Conversations API, webhooks send **conversation events**, not direct message events. Each event includes:
- `ConversationSid` - The conversation ID
- Participant data with `proxyAddress` - Identifies which number

### 2. How to Identify the Number

Your webhook receives events like:
```json
{
  "EventType": "onMessageAdded",
  "ConversationSid": "CHxxx...",
  "ParticipantSid": "MBxxx...",
  // You fetch the conversation to get proxyAddress
}
```

Then in your code:
```typescript
// Fetch conversation to get participants
const conversation = await client.conversations.v1.conversations(conversationSid).fetch();
const participants = await conversation.participants.list();

// Find customer participant
const customerParticipant = participants.find(p => 
  p.messagingBinding?.address && !p.identity?.startsWith('agent-')
);

// Extract which number this conversation uses
const proxyAddress = customerParticipant.messagingBinding.proxyAddress;
// e.g., "whatsapp:+1234567890" or "whatsapp:+0987654321"
```

### 3. Your Current Implementation

Your code already handles this:
- Extracts `proxyAddress` from conversations
- Matches to configured numbers
- Filters conversations by number

## Setup Options

### Option 1: ONE Messaging Service (Recommended) ✅

**Benefits:**
- ✅ Simpler configuration
- ✅ Shared settings (webhooks, status callbacks)
- ✅ One place to manage all numbers
- ✅ Easier maintenance

**Setup:**
1. Create **one Messaging Service** in Twilio Console
2. Add **all your WhatsApp numbers** to this service
3. Set **one webhook URL** for all numbers
4. Your webhook identifies which number via `proxyAddress`

**Webhook URL:**
```
https://your-ngrok-url.ngrok-free.app/api/twilio/conversations/webhook
```

### Option 2: Separate Messaging Services (Advanced)

**When to use:**
- Different webhook handlers per number
- Different status callbacks per number
- Separate compliance/regulation requirements
- Different departments with different settings

**Setup:**
1. Create **separate Messaging Service** for each number
2. Set **different webhook URLs** for each service
3. Each webhook handles only that number's messages

**Example:**
- Support Service: `https://your-app.com/webhooks/support`
- Sales Service: `https://your-app.com/webhooks/sales`

## Conversations API Webhook Configuration

### Webhook URL Format

For Conversations API, you configure webhooks at the **Service level**, not individual numbers:

```
POST https://your-ngrok-url.ngrok-free.app/api/twilio/conversations/webhook
```

### Webhook Events

Your webhook will receive events like:
- `onMessageAdded` - New message received
- `onConversationUpdated` - Conversation changed
- `onParticipantAdded` - Participant joined
- `onParticipantUpdated` - Participant updated

### Identifying the Number in Webhook

```typescript
// In your webhook handler
app.post('/api/twilio/conversations/webhook', async (req, res) => {
  const { ConversationSid, EventType } = req.body;
  
  // Fetch conversation to get participants
  const conversation = await twilioClient
    .conversations.v1
    .conversations(ConversationSid)
    .fetch();
  
  const participants = await twilioClient
    .conversations.v1
    .conversations(ConversationSid)
    .participants
    .list();
  
  // Find customer participant
  const customerParticipant = participants.find(p => 
    p.messagingBinding?.proxyAddress
  );
  
  // Get which number this conversation uses
  const proxyAddress = customerParticipant.messagingBinding.proxyAddress;
  // e.g., "whatsapp:+1234567890"
  
  // Match to your configured numbers
  const numberConfig = getNumberByPhone(proxyAddress);
  // Returns: { id: "1", name: "Support Number", ... }
  
  // Process based on number
  if (numberConfig.id === "1") {
    // Handle Support Number messages
  } else if (numberConfig.id === "2") {
    // Handle Sales Number messages
  }
  
  res.status(200).send('OK');
});
```

## Twilio Console Configuration

### For ONE Messaging Service (Recommended)

1. **Create Messaging Service:**
   - Go to Twilio Console → Messaging → Services
   - Click "Create Messaging Service"
   - Name: "WhatsApp Conversations Service"

2. **Add Numbers:**
   - Add all your WhatsApp numbers to this service
   - Numbers: `+1234567890`, `+0987654321`, etc.

3. **Configure Webhook:**
   - Webhook URL: `https://your-ngrok-url.ngrok-free.app/api/twilio/conversations/webhook`
   - Method: POST
   - Status Callback: (optional) `https://your-ngrok-url.ngrok-free.app/api/twilio/status`

4. **Assign to WhatsApp Numbers:**
   - Go to each WhatsApp number's settings
   - Set Messaging Service to your created service
   - Webhook will be inherited from the service

### For Separate Services (Advanced)

1. **Create Service 1 (Support):**
   - Name: "Support WhatsApp Service"
   - Add Support Number: `+1234567890`
   - Webhook: `https://your-app.com/webhooks/support`

2. **Create Service 2 (Sales):**
   - Name: "Sales WhatsApp Service"
   - Add Sales Number: `+0987654321`
   - Webhook: `https://your-app.com/webhooks/sales`

3. **Assign Services:**
   - Each number uses its respective service
   - Each webhook handles only that number

## Important Notes

### Conversations API vs Messaging API

**Conversations API (What you're using):**
- ✅ One webhook for all conversations
- ✅ Identify number via `proxyAddress` in participant data
- ✅ Webhook configured at Service level
- ✅ Conversations are independent per number

**Messaging API (Alternative):**
- Each number can have its own webhook
- Identify number via `From` field in webhook payload
- Webhook configured per number

### Current Implementation

Your code already supports multiple numbers with one webhook:
- Extracts `proxyAddress` from conversations
- Matches to configured numbers
- Filters conversations by number in UI

## Recommendation

**Use ONE Messaging Service + ONE Webhook URL** because:

1. ✅ **Simpler**: Less configuration, easier to maintain
2. ✅ **Works with your code**: Already extracts `proxyAddress`
3. ✅ **Conversations API**: Designed for this pattern
4. ✅ **Flexible**: Can still identify and filter by number

## Setup Steps

1. **Create ONE Messaging Service** in Twilio Console
2. **Add all WhatsApp numbers** to this service
3. **Set ONE webhook URL**: `https://your-ngrok-url.ngrok-free.app/api/twilio/conversations/webhook`
4. **Your webhook identifies number** via `proxyAddress` (already implemented)
5. **Filter in UI** by number (already implemented)

## Summary

**Question**: Do I need separate messaging services and webhook URLs?

**Answer**: **NO** - You can use:
- ✅ **ONE Messaging Service** for all numbers
- ✅ **ONE Webhook URL** for all numbers
- ✅ **Identify number** via `proxyAddress` in participant data (already done)

Only create separate services/webhooks if you need:
- Different webhook handlers per number
- Different compliance/regulation requirements
- Separate departments with different settings

