# Twilio WhatsApp Contact Names Setup

## Current Status
The app now removes mock data and automatically captures real contact information from Twilio's WhatsApp webhooks using ProfileName and WaId parameters.

## What You'll See Now
- **Without WhatsApp messages**: Contact names will show as "WhatsApp +20 10 1666 6348" (formatted phone numbers)
- **With WhatsApp messages**: Contact names will show real WhatsApp display names like "Ahmed Ali"

## How It Works
When a WhatsApp user sends a message to your Twilio WhatsApp number:
1. **Twilio sends webhook** to `/api/twilio/webhook` with ProfileName and WaId
2. **We extract** `ProfileName` and `WaId` from the webhook payload
3. **We store** the real name and phone number in our contact mapping
4. **Twilio conversations** automatically use the stored contact names

## Setup Instructions

### Step 1: Configure Twilio WhatsApp Webhook
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to Messaging > Settings > WhatsApp sandbox settings
3. Set webhook URL: `https://your-domain.com/api/twilio/webhook`
4. Subscribe to `onMessageAdded` events

### Step 2: Environment Variables
Make sure these are set in your `.env` file:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

### Step 3: Test the Flow
1. Send a WhatsApp message to your Twilio WhatsApp number
2. Check your app - the contact name should appear automatically
3. Check console logs for webhook processing

## Webhook Payload Example
When Twilio receives a WhatsApp message, it sends a webhook with:
```
ProfileName: "Ahmed Ali"           // WhatsApp display name
WaId: "201234567890"              // WhatsApp ID (phone number)
From: "whatsapp:+201234567890"    // Full WhatsApp address
Body: "Hello!"                    // Message content
```

## Current Behavior
- ✅ **No more mock data** - "Ahmed Hassan" is removed
- ✅ **Real phone numbers** - Shows formatted phone numbers as fallback
- ✅ **Twilio webhook ready** - Automatically captures real contact names
- ✅ **Automatic storage** - Contact names are stored when users message you
- ✅ **Real-time updates** - New contacts appear immediately in your app
- ✅ **Avatar generation** - Uses UI Avatars service for profile pictures

## Testing
1. Set up the webhook URL in Twilio Console
2. Send a WhatsApp message to your Twilio WhatsApp number
3. Check your app - you should see the real contact name
4. Check console logs for webhook processing

## Notes
- **ProfileName** is the user's WhatsApp display name (not guaranteed to be real name)
- **WaId** is the user's phone number in WhatsApp format
- **No profile photos** - Twilio doesn't provide user profile photos via API
- **Automatic avatars** - Generated using UI Avatars service based on the name
