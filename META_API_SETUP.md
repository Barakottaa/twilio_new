# Meta WhatsApp Business API Setup for Real Contact Information

## Current Status
The app now removes mock data and automatically captures real contact information from Meta's WhatsApp Business API webhooks.

## What You'll See Now
- **Without Meta webhook**: Contact names will show as "WhatsApp +20 10 1666 6348" (formatted phone numbers)
- **With Meta webhook**: Contact names will show real WhatsApp display names like "Ahmed Ali"

## How It Works
When a WhatsApp user sends a message to your business:
1. **Meta sends webhook** to `/api/meta/webhook` with contact info
2. **We extract** `contacts[0].profile.name` and `contacts[0].wa_id`
3. **We store** the real name and phone number in our contact mapping
4. **Twilio conversations** automatically use the stored contact names

## Setup Instructions

### Step 1: Set up Meta Business Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a Meta Business account
3. Create a new app and select "Business" type

### Step 2: Set up WhatsApp Business API
1. In your app, add "WhatsApp" product
2. Follow the setup wizard
3. Get your Phone Number ID and Access Token

### Step 3: Add Environment Variables
Add these to your `.env` file:
```env
# Meta WhatsApp Business API
META_ACCESS_TOKEN=your_meta_access_token
META_PHONE_NUMBER_ID=your_phone_number_id
META_VERIFY_TOKEN=your_webhook_verify_token
```

### Step 4: Configure Webhooks
1. In Meta Developer Console, go to WhatsApp > Configuration
2. Set webhook URL: `https://your-domain.com/api/meta/webhook`
3. Set verify token: Use the same value as `META_VERIFY_TOKEN`
4. Subscribe to `messages` events

### Step 5: Test the Flow
1. Send a WhatsApp message to your business number
2. Check your app - the contact name should appear automatically
3. Check console logs for webhook processing

## Webhook Payload Example
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "contacts": [{
          "profile": {
            "name": "Ahmed Ali"
          },
          "wa_id": "201234567890"
        }],
        "messages": [...]
      }
    }]
  }]
}
```

## Current Behavior
- ✅ **No more mock data** - "Ahmed Hassan" is removed
- ✅ **Real phone numbers** - Shows formatted phone numbers as fallback
- ✅ **Meta webhook ready** - Automatically captures real contact names
- ✅ **Automatic storage** - Contact names are stored when users message you
- ✅ **Real-time updates** - New contacts appear immediately in your app

## Testing
1. Set up the webhook URL in Meta Developer Console
2. Send a WhatsApp message to your business number
3. Check your app - you should see the real contact name
4. Check console logs for webhook processing
