const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
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
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
  console.log('✅ Loaded .env.local');
} else {
  console.log('⚠️  .env.local not found at:', envPath);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const chatServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID || 'ISa0cc331448b044b68b90e71ba202896c';

if (!accountSid || !authToken) {
  console.error('❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in environment');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log('🔍 Checking Twilio Webhook Configuration...\n');
console.log('Chat Service SID:', chatServiceSid);
console.log('');

client.conversations.v1
  .services(chatServiceSid)
  .configuration()
  .fetch()
  .then(config => {
    console.log('📋 Current Webhook Configuration:');
    console.log('================================');
    console.log('Post Webhook URL:', config.postWebhookUrl || '❌ NOT SET');
    console.log('Webhook Method:', config.method);
    console.log('Webhook Filters:', config.filters || 'None');
    console.log('');
    
    if (!config.postWebhookUrl || config.postWebhookUrl.includes('localhost')) {
      console.log('⚠️  WARNING: Webhook is not configured or pointing to localhost!');
      console.log('');
      console.log('💡 To fix this:');
      console.log('1. Install ngrok: https://ngrok.com/download');
      console.log('2. Run: ngrok http 3000');
      console.log('3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
      console.log('4. Go to Twilio Console > Conversations > Your Service > Webhooks');
      console.log('5. Set Post-Event URL to: https://abc123.ngrok.io/api/twilio/conversations-events');
      console.log('6. Enable events: onMessageAdded, onConversationAdded, onParticipantAdded');
      console.log('7. Save');
    } else {
      console.log('✅ Webhook is configured!');
      console.log('');
      console.log('🧪 To test, send a WhatsApp message and check server logs for:');
      console.log('   "🔔 CONVERSATION EVENTS WEBHOOK CALLED"');
    }
  })
  .catch(error => {
    console.error('❌ Error fetching webhook config:', error.message);
    console.log('');
    console.log('Make sure your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct.');
  });

