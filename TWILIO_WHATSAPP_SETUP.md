# Twilio WhatsApp Contact Names Setup

## Current Status
The app now automatically captures real contact information from Twilio's WhatsApp webhooks.

## What You'll See Now
- **Without Twilio webhook configured**: Contact names will show as formatted phone numbers (e.g., "WhatsApp +20 10 1666 6348")
- **With Twilio webhook configured**: Contact names will show real WhatsApp display names (e.g., "Ahmed Ali")

## How It Works
When a WhatsApp user sends a message to your business via Twilio:
1. **Twilio sends webhook** to your configured endpoint (`/api/twilio/messaging`) with `ProfileName` and `WaId`
2. **We extract** `ProfileName` (WhatsApp display name) and `WaId` (user's phone number)
3. **We store** the real name and phone number in our contact mapping system
4. **Twilio conversations** automatically use the stored contact names

## Setup Instructions

### Step 1: Set up Twilio WhatsApp Sandbox or Number
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to Messaging > Try it out > WhatsApp sandbox, or configure a WhatsApp-enabled phone number

### Step 2: Configure Webhooks in Twilio Console
You need to configure **TWO** webhook URLs in your Twilio Console for your WhatsApp number:

#### 1. A Message Comes In (Main Webhook)
This webhook captures the `ProfileName` and `WaId` for incoming messages.
- **Go to**: Twilio Console → Messaging → Settings → WhatsApp sandbox settings (or your WhatsApp-enabled number's configuration)
- **Find**: "WHEN A MESSAGE COMES IN"
- **Set Webhook URL**: `https://your-domain.com/api/twilio/messaging`
  - **For local testing with Cloudflare Tunnel**: Use `https://your-tunnel-url.trycloudflare.com/api/twilio/messaging`
- **Set Method**: `HTTP POST`

#### 2. Status Callback URL (Optional, but Recommended)
This webhook receives updates on message delivery status.
- **Go to**: Twilio Console → Messaging → Settings → WhatsApp sandbox settings (or your WhatsApp-enabled number's configuration)
- **Find**: "STATUS CALLBACK URL"
- **Set Status Callback URL**: `https://your-domain.com/api/twilio/whatsapp-status`
  - **For local testing with Cloudflare Tunnel**: Use `https://your-tunnel-url.trycloudflare.com/api/twilio/whatsapp-status`
- **Set Method**: `HTTP POST`

### Step 3: Test the Flow
1. Ensure your Next.js app is running and accessible via the Cloudflare Tunnel URL
2. Send a WhatsApp message to your Twilio WhatsApp number (from a new number if possible, or one not already in your local contact map)
3. Check your app - the contact name should appear automatically
4. Check your Next.js server console logs for messages like:
   - `👤 WhatsApp contact info: { profileName: 'Ahmed Ali', waId: '201234567890', from: 'whatsapp:+201234567890' }`
   - `✅ WhatsApp contact stored: { phoneNumber: '+201234567890', profileName: 'Ahmed Ali', avatar: '...' }`

## Webhook Parameters from Twilio
Twilio includes these parameters in inbound WhatsApp message webhooks:
- `ProfileName`: The sender's WhatsApp display name (e.g., "Ahmed Ali")
- `WaId`: The sender's WhatsApp ID (their phone number in WhatsApp format, e.g., "201234567890")
- `From`: The sender's full WhatsApp address (e.g., "whatsapp:+201234567890")
- `Body`: The user's message text

## Current Behavior
- ✅ **No more mock data** - "Ahmed Hassan" from previous mock data is removed
- ✅ **Real phone numbers** - Shows formatted phone numbers as fallback if `ProfileName` is not yet captured
- ✅ **Twilio webhook ready** - Automatically captures real WhatsApp display names when configured
- ✅ **Automatic storage** - Contact names are stored in an in-memory map when users message you
- ✅ **Real-time updates** - New contacts appear immediately in your app

## Testing
1. Configure the webhook URLs in Twilio Console as described in Step 2
2. Send a WhatsApp message to your Twilio WhatsApp number
3. Check your app - you should see the real contact name
4. Check console logs for webhook processing

## Troubleshooting
- **Names still showing as phone numbers**: Check that the Messaging webhook is configured correctly
- **Webhook not receiving calls**: Verify the tunnel URL is accessible and the endpoint returns 200 OK
- **Console errors**: Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set in your environment