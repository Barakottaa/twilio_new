# 🔍 Media Message Debug Guide

## 🚨 **Issue: Document Message Not Appearing**

Let's debug this step by step to identify why your document message didn't appear.

## 🔍 **Step 1: Check Webhook Configuration**

### **Verify Twilio Webhook Settings:**
1. **Go to Twilio Console** → Messaging → Settings → WhatsApp
2. **Check webhook URL**: Should be `https://your-domain.com/api/twilio/webhook`
3. **Verify HTTP method**: Should be `POST`
4. **Check if webhook is enabled** for message events

### **Test Webhook Reachability:**
```bash
# Test if your webhook is reachable
curl -X GET https://your-domain.com/api/twilio/webhook
# Should return: "Webhook endpoint is working"
```

## 🔍 **Step 2: Check Webhook Logs**

### **Look for these log messages:**
```
🚨 WEBHOOK CALLED - Raw request received
✅ Verified Twilio webhook received
📸 Media debug - NumMedia: [number]
🎯 Media files detected in webhook!
```

### **If you see:**
- ❌ **No webhook logs**: Webhook not configured or not reachable
- ❌ **NumMedia: 0**: Twilio didn't send media parameters
- ✅ **NumMedia > 0**: Media detected, check processing

## 🔍 **Step 3: Debug Media Processing**

### **Use the debug endpoint:**
```bash
# Test media webhook processing
curl -X POST https://your-domain.com/api/debug-media-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "EventType=onMessageAdded&NumMedia=1&MediaUrl0=https://example.com/doc.pdf&MediaContentType0=application/pdf&ConversationSid=test&MessageSid=test&Author=test"
```

### **Check the response for:**
- `numMedia`: Should be > 0
- `hasMedia`: Should be true
- `mediaFiles`: Should contain your media URLs

## 🔍 **Step 4: Common Issues & Solutions**

### **Issue 1: Webhook Not Configured**
**Symptoms:**
- No webhook logs appear
- Messages don't appear in real-time

**Solution:**
1. Configure webhook in Twilio Console
2. Set URL to: `https://your-domain.com/api/twilio/webhook`
3. Set method to: `POST`

### **Issue 2: Media Not Detected**
**Symptoms:**
- Webhook logs show `NumMedia: 0`
- Text messages work, media doesn't

**Possible Causes:**
- Twilio sandbox limitations
- Webhook configuration issue
- Media size too large

**Solution:**
1. Check Twilio sandbox settings
2. Verify media file size (should be < 5MB)
3. Test with different media types

### **Issue 3: Media Detected But Not Displayed**
**Symptoms:**
- Webhook logs show media detected
- Media doesn't appear in UI

**Possible Causes:**
- UI component not rendering
- Media URL expired
- CORS issues

**Solution:**
1. Check browser console for errors
2. Test media URL directly
3. Check network tab for failed requests

## 🧪 **Step 5: Test Media Display**

### **Test with the test endpoint:**
```bash
# Test media display in UI
curl -X POST https://your-domain.com/api/test-media-message \
  -H "Content-Type: application/json" \
  -d '{
    "mediaType": "document",
    "mediaUrl": "https://via.placeholder.com/300x200?text=Test+Document",
    "conversationSid": "test"
  }'
```

### **Check if test message appears in UI**

## 🔧 **Step 6: Manual Debugging**

### **Add temporary debug logging:**
```typescript
// In your webhook handler, add this:
console.log('🔍 FULL WEBHOOK DEBUG:', {
  allParams: params,
  numMedia: parseInt(params.NumMedia || '0', 10),
  mediaUrls: Array.from({ length: parseInt(params.NumMedia || '0', 10) }, (_, i) => params[`MediaUrl${i}`]),
  eventType: params.EventType
});
```

### **Check browser console:**
1. Open browser dev tools
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

## 📱 **Step 7: Test Different Media Types**

### **Test with different media:**
1. **Image**: Send a photo
2. **Document**: Send a PDF
3. **Audio**: Send a voice message
4. **Video**: Send a video

### **Check which types work:**
- If images work but documents don't → Document-specific issue
- If nothing works → General media processing issue
- If some work → Media type handling issue

## 🚨 **Quick Fixes to Try**

### **Fix 1: Restart Your App**
```bash
# If using local development
npm run dev

# If deployed, redeploy
```

### **Fix 2: Clear Browser Cache**
- Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try incognito/private mode

### **Fix 3: Check Twilio Sandbox**
- Verify sandbox is properly configured
- Check if media messages are enabled
- Test with a different Twilio number

### **Fix 4: Verify Webhook URL**
- Make sure webhook URL is correct
- Check if HTTPS is working
- Verify domain is accessible

## 📊 **Debug Checklist**

- [ ] Webhook is configured in Twilio Console
- [ ] Webhook URL is reachable
- [ ] Webhook logs show incoming requests
- [ ] Media parameters are detected (`NumMedia > 0`)
- [ ] Media URLs are valid and accessible
- [ ] UI components are rendering
- [ ] No JavaScript errors in browser console
- [ ] Network requests are successful

## 🆘 **Still Not Working?**

### **Send me these details:**
1. **Webhook logs** (from your server console)
2. **Browser console errors** (if any)
3. **Twilio webhook configuration** (screenshot)
4. **Media file details** (type, size, format)
5. **Your domain/URL** (for testing)

### **Quick Test Commands:**
```bash
# Test webhook reachability
curl -X GET https://your-domain.com/api/twilio/webhook

# Test media processing
curl -X POST https://your-domain.com/api/debug-media-webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "EventType=onMessageAdded&NumMedia=1&MediaUrl0=https://example.com/test.pdf&MediaContentType0=application/pdf"

# Test media display
curl -X POST https://your-domain.com/api/test-media-message \
  -H "Content-Type: application/json" \
  -d '{"mediaType":"document","mediaUrl":"https://via.placeholder.com/300x200?text=Test"}'
```

## 🎯 **Most Likely Issues**

1. **Webhook not configured** (90% of cases)
2. **Media not detected by Twilio** (5% of cases)
3. **UI rendering issue** (3% of cases)
4. **URL/CORS issue** (2% of cases)

**Let's start with checking your webhook configuration!** 🔍
