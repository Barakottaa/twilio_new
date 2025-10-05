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
const chatServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID || 'ISa0cc331448b044b68b90e71ba202896c';

const NGROK_URL = 'https://undegenerated-nonviscidly-marylou.ngrok-free.dev';
const WEBHOOK_URL = `${NGROK_URL}/api/twilio/conversations-events`;

console.log('🔧 Setting up Twilio Webhook...\n');
console.log('Chat Service SID:', chatServiceSid);
console.log('Webhook URL:', WEBHOOK_URL);
console.log('');

const client = twilio(accountSid, authToken);

client.conversations.v1
  .services(chatServiceSid)
  .configuration()
  .update({
    postWebhookUrl: WEBHOOK_URL,
    filters: ['onMessageAdded', 'onConversationAdded', 'onParticipantAdded']
  })
  .then(config => {
    console.log('✅ Webhook configured successfully!');
    console.log('');
    console.log('📋 Configuration:');
    console.log('Post Webhook URL:', config.postWebhookUrl);
    console.log('Webhook Filters:', config.filters);
    console.log('');
    console.log('🧪 Now test by sending a WhatsApp message!');
    console.log('You should see it appear in real-time in your chat UI.');
  })
  .catch(error => {
    console.error('❌ Error configuring webhook:', error.message);
  });

