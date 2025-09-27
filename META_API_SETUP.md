# Meta API Setup for Real Contact Information

## Current Status
The app now removes mock data and attempts to get real contact information from Meta's WhatsApp Business API.

## What You'll See Now
- **Without Meta API**: Contact names will show as "WhatsApp +20 10 1666 6348" (formatted phone numbers)
- **With Meta API**: Contact names will show real names from WhatsApp profiles

## To Get Real Contact Names and Profile Pictures

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
META_ACCESS_TOKEN=your_meta_access_token
META_PHONE_NUMBER_ID=your_phone_number_id
```

### Step 4: Configure Webhooks
1. Set up webhooks in Meta Developer Console
2. Point to your webhook URL: `https://your-domain.com/api/meta/webhook`

## Current Behavior
- ✅ **No more mock data** - "Ahmed Hassan" is removed
- ✅ **Real phone numbers** - Shows formatted phone numbers like "WhatsApp +20 10 1666 6348"
- ✅ **Meta API ready** - Will automatically use Meta API when credentials are provided
- ✅ **Fallback system** - Works without Meta API credentials

## Testing
1. Refresh your app
2. You should see "WhatsApp +20 10 1666 6348" instead of "Ahmed Hassan"
3. Check console logs for contact lookup process
