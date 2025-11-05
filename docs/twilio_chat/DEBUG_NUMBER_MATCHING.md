# Debugging Number Matching Issues

## Current Issue: Can't See Messages for New Number

### Possible Causes:

1. **Number not in environment variables**
   - Check `.env.local` or `.env` file
   - Should have `TWILIO_WHATSAPP_NUMBER_3=whatsapp:+YOUR_NUMBER`

2. **Conversations don't exist yet**
   - New number needs to have received/sent messages first
   - Conversations are created when customer messages the number

3. **proxyAddress format mismatch**
   - Twilio sends: `whatsapp:+1234567890`
   - Your config might have: `+1234567890` (without whatsapp:)
   - The matching should handle both, but let's verify

4. **Conversations not refreshed**
   - Need to refresh conversation list after adding number
   - Or wait for new conversations to be created

## How to Debug:

### Step 1: Check Server Logs

When you load conversations, check the server console for:
- `✅ Matched proxyAddress ...` - Shows successful matches
- `⚠️ No match found for proxyAddress ...` - Shows mismatches
- `📋 Loaded number X: ...` - Shows what numbers are configured

### Step 2: Check Browser Console

Open browser console (F12) and look for:
- Number selector dropdown showing all numbers
- Conversation filtering logs

### Step 3: Test the API

```bash
# Check configured numbers
curl http://localhost:3000/api/twilio/numbers

# Check conversations (should show proxyAddress in logs)
curl http://localhost:3000/api/twilio/conversations?agentId=admin_001
```

### Step 4: Verify proxyAddress Format

The matching handles:
- `whatsapp:+1234567890` (with whatsapp: prefix)
- `+1234567890` (without whatsapp: prefix)

Both should work, but check server logs to see what format Twilio is sending.

## Quick Fix Checklist:

1. ✅ Add number to `.env.local`:
   ```
   TWILIO_WHATSAPP_NUMBER_3=whatsapp:+YOUR_NEW_NUMBER
   ```

2. ✅ Restart server (already done)

3. ✅ Verify number appears in `/api/twilio/numbers`

4. ✅ Check server logs for proxyAddress matching

5. ✅ Refresh conversations in UI

6. ✅ Select the number from dropdown

7. ✅ If still no conversations, send a test message to the new number first

