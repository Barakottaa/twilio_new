# Twilio WhatsApp Setup Guide

## 🎯 Simplified Setup

This guide will help you set up WhatsApp integration with the simplified webhook architecture.

## 📋 Prerequisites

- Twilio Account
- WhatsApp Business API access (Sandbox or Production)
- Your application running and accessible via HTTPS

## 🚀 Quick Setup

### Step 1: Configure Twilio Console

1. **Go to Twilio Console** → Messaging → WhatsApp
2. **Set Webhook URL**: `https://your-domain.com/api/twilio/webhook`
3. **Set HTTP Method**: `POST`
4. **Save Configuration**

### Step 2: Test the Integration

1. **Send a WhatsApp message** to your Twilio number
2. **Check your application** - the message should appear
3. **Verify contact names** are automatically detected

## 🔧 How It Works

### Simplified Webhook Architecture

The application now uses a **single webhook endpoint** (`/api/twilio/webhook`) that handles:

- ✅ **Message Events**: Incoming WhatsApp messages
- ✅ **Contact Detection**: Automatic ProfileName and WaId extraction
- ✅ **Media Messages**: Images, videos, audio, documents
- ✅ **Real-time Updates**: Live message broadcasting
- ✅ **Security**: Twilio signature validation

### What You'll See

- **Without webhook configured**: Contact names show as formatted phone numbers
- **With webhook configured**: Contact names show real WhatsApp display names

## 📱 Webhook Events Handled

The simplified webhook handles these Twilio events:

1. **`onMessageAdded`** - New message received
2. **`onMessageReceived`** - Message delivery confirmation
3. **`onConversationAdded`** - New conversation started
4. **`onParticipantAdded`** - New participant joined

## 🔍 Testing

### Test Webhook Connectivity

```bash
# Test if webhook is reachable
curl https://your-domain.com/api/twilio/webhook

# Should return: "Webhook endpoint is working"
```

### Test Message Flow

1. Send WhatsApp message to your Twilio number
2. Check application logs for:
   ```
   ✅ Verified Twilio webhook: { eventType: 'onMessageAdded' }
   👤 Processing contact: { phone: '+1234567890', name: 'John Doe' }
   📨 Processing message event
   ✅ Message event processed
   ```

## 🛠️ Troubleshooting

### Webhook Not Receiving Calls

1. **Check URL accessibility:**
   ```bash
   curl https://your-domain.com/api/twilio/webhook
   ```

2. **Verify Twilio configuration:**
   - Webhook URL is correct
   - HTTP method is POST
   - URL is accessible from internet

3. **Check application logs:**
   ```bash
   # Docker
   docker-compose logs -f
   
   # Local development
   npm run dev
   ```

### Contact Names Not Showing

1. **Verify webhook is configured** in Twilio Console
2. **Check webhook logs** for contact processing
3. **Ensure ProfileName is being sent** by Twilio

### Media Messages Not Working

1. **Check media parameters** in webhook logs
2. **Verify media URLs** are accessible
3. **Check file size limits** (Twilio has limits)

## 🔒 Security

The webhook includes built-in security:

- **Signature Validation**: Verifies requests come from Twilio
- **Error Handling**: Comprehensive error logging
- **Rate Limiting**: Protection against abuse

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl https://your-domain.com/api/auth/me

# Webhook health
curl https://your-domain.com/api/twilio/webhook
```

### Log Monitoring

Look for these log messages:
- `✅ Verified Twilio webhook` - Webhook received and validated
- `👤 Processing contact` - Contact information extracted
- `📨 Processing message event` - Message being processed
- `✅ Message event processed` - Message successfully handled

## 🎉 Success Indicators

You'll know the setup is working when you see:

1. **Webhook receives calls** (check logs)
2. **Messages appear in app** in real-time
3. **Contact names show correctly** (not just phone numbers)
4. **Media messages display** properly
5. **Real-time updates work** across multiple browser tabs

---

**The simplified architecture makes setup and maintenance much easier!**