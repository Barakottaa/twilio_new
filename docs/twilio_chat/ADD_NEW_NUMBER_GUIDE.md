# How to Add a New Number and Select Its Conversations

## Step 1: Configure the New Number in Environment Variables

You have two options to configure numbers:

### Option A: Using JSON Configuration (Recommended)

Add to your `.env.local` or `.env` file:

```env
TWILIO_NUMBERS_CONFIG={"numbers":[{"id":"1","number":"+1234567890","name":"Support Number","department":"Customer Service","isActive":true},{"id":"2","number":"+0987654321","name":"Sales Number","department":"Sales Team","isActive":true},{"id":"3","number":"+1111111111","name":"New Number","department":"General","isActive":true}]}
```

### Option B: Using Individual Environment Variables

Add to your `.env.local` or `.env` file:

```env
TWILIO_WHATSAPP_NUMBER_1=whatsapp:+1234567890
TWILIO_WHATSAPP_NUMBER_2=whatsapp:+0987654321
TWILIO_WHATSAPP_NUMBER_3=whatsapp:+1111111111
```

**Note**: With Option B, numbers will be auto-named as "Number 1", "Number 2", "Number 3", etc.

## Step 2: Configure the Number in Twilio Conversation Service

**CRITICAL**: For each new number, you must configure it in Twilio Console to auto-create conversations.

1. **Go to Twilio Console** → **Conversations** → **Conversation Services**
2. **Select your Conversation Service**
3. **Go to "Numbers" or "Phone Numbers" section**
4. **Add your new number** to the conversation service
5. **Enable "Auto-create conversations"** for incoming messages
   - This ensures that when messages arrive at your new number, Twilio automatically creates conversations in the Conversations API
   - Without this, messages will appear in Messaging Logs but won't create conversations

**Note**: If you skip this step, messages to your new number will:
- ✅ Appear in Twilio Messaging Logs
- ❌ NOT appear in the Conversations API
- ❌ NOT show up in the `twilio_chat` application

## Step 3: Restart Your Server

After adding the number to environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
cd twilio_chat
npm run dev
```

## Step 4: Select the Number in the UI

1. **Open the conversation list** (left sidebar)
2. **Look for the Number Filter** dropdown in the filters section
3. **Click the dropdown** (it has a phone icon 📱)
4. **Select your new number** from the list
5. **Conversations will filter** to show only conversations from that number

## Step 4: Verify the Number Appears

The number selector should show:
- ✅ All configured numbers from your environment variables
- ✅ Your new number in the dropdown
- ✅ Conversations filtered when you select it

## Troubleshooting

### Number Not Appearing in Dropdown?

1. **Check environment variables:**
   ```bash
   # Verify your .env.local or .env file has the number
   ```

2. **Check the API:**
   ```bash
   # Test the numbers API
   curl http://localhost:3000/api/twilio/numbers
   ```
   Should return your configured numbers including the new one.

3. **Restart the server:**
   - Environment variables are loaded at startup
   - Changes require a restart

### Conversations Not Showing for New Number?

1. **CRITICAL: Check Conversation Service Configuration:**
   - ⚠️ **Most common issue**: Number not added to Conversation Service or auto-create not enabled
   - Go to Twilio Console → Conversations → Conversation Services
   - Verify your number is added to the conversation service
   - Verify "Auto-create conversations" is enabled
   - Without this, messages appear in Messaging Logs but NOT in Conversations API

2. **Wait for new conversations:**
   - Only conversations created AFTER the number was configured in Conversation Service will appear
   - Old messages won't automatically create conversations retroactively

3. **Check proxyAddress matching:**
   - The system matches `proxyAddress` from Twilio to your configured numbers
   - Make sure the number format matches exactly (with or without `whatsapp:` prefix)

4. **Refresh conversations:**
   - Click the refresh button in the conversation list
   - Or reload the page

5. **Test with debug endpoint:**
   - Visit `http://localhost:3000/api/twilio/debug-conversations`
   - This shows ALL conversations from Twilio and their proxy addresses
   - Verify if conversations for your number exist in Twilio

## Example Configuration

### For 3 Numbers:

**Method 1: JSON (Better for naming)**
```env
TWILIO_NUMBERS_CONFIG={"numbers":[{"id":"1","number":"+1234567890","name":"Support","department":"Support","isActive":true},{"id":"2","number":"+0987654321","name":"Sales","department":"Sales","isActive":true},{"id":"3","number":"+1111111111","name":"Marketing","department":"Marketing","isActive":true}]}
```

**Method 2: Individual Variables (Simpler)**
```env
TWILIO_WHATSAPP_NUMBER_1=whatsapp:+1234567890
TWILIO_WHATSAPP_NUMBER_2=whatsapp:+0987654321
TWILIO_WHATSAPP_NUMBER_3=whatsapp:+1111111111
```

## How It Works

1. **Configuration**: Numbers are read from environment variables
2. **API**: `/api/twilio/numbers` returns configured numbers
3. **UI**: Number selector dropdown shows all configured numbers
4. **Filtering**: Selecting a number filters conversations by `twilioNumberId`
5. **Matching**: System matches `proxyAddress` from Twilio to configured numbers

## Quick Checklist

- [ ] Add number to `.env.local` or `.env`
- [ ] **Configure number in Twilio Conversation Service** (CRITICAL - see Step 2)
- [ ] **Enable "Auto-create conversations"** in Twilio Console
- [ ] Restart server (`npm run dev`)
- [ ] Verify number appears in `/api/twilio/numbers` API
- [ ] Check number appears in UI dropdown
- [ ] Select the number to filter conversations
- [ ] Verify conversations show for that number

