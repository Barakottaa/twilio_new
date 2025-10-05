const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const chatServiceSid = 'ISa0cc331448b044b68b90e71ba202896c';

const NGROK_URL = 'https://undegenerated-nonviscidly-marylou.ngrok-free.dev';
const WEBHOOK_URL = `${NGROK_URL}/api/twilio/conversations-events`;

console.log('🔧 Setting up Twilio Webhook (Method 2)...\n');
console.log('Account SID:', accountSid);
console.log('Chat Service SID:', chatServiceSid);
console.log('Webhook URL:', WEBHOOK_URL);
console.log('');

const client = twilio(accountSid, authToken);

// Update the service with webhook configuration
client.conversations.v1
  .services(chatServiceSid)
  .update({
    postWebhookUrl: WEBHOOK_URL,
    webhookMethod: 'POST',
    webhookFilters: ['onMessageAdded', 'onConversationAdded', 'onParticipantAdded']
  })
  .then(service => {
    console.log('✅ Webhook configured successfully!');
    console.log('');
    console.log('📋 Service Configuration:');
    console.log('Friendly Name:', service.friendlyName);
    console.log('Post Webhook URL:', service.postWebhookUrl);
    console.log('Webhook Method:', service.webhookMethod);
    console.log('Webhook Filters:', service.webhookFilters);
    console.log('');
    console.log('🧪 TEST NOW:');
    console.log('1. Send a WhatsApp message to your Twilio number');
    console.log('2. Watch the server logs for: "🔔 CONVERSATION EVENTS WEBHOOK CALLED"');
    console.log('3. The message should appear in your UI in REAL-TIME!');
  })
  .catch(error => {
    console.error('❌ Error configuring webhook:', error);
    console.log('');
    console.log('📝 Manual setup instructions:');
    console.log('1. Go to: https://console.twilio.com/us1/develop/conversations/manage/services');
    console.log('2. Click on your service');
    console.log('3. Click "Webhooks"');
    console.log('4. Set Post-Event URL to:', WEBHOOK_URL);
    console.log('5. Enable: onMessageAdded, onConversationAdded, onParticipantAdded');
    console.log('6. Click Save');
  });

