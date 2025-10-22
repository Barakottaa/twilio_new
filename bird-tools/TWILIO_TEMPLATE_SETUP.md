# Twilio Content Template Setup Guide

## Overview
This guide explains how to set up Twilio Content Templates for sending custom PDFs via WhatsApp, which solves the 24-hour window issues we've been experiencing with Bird.

## Why Twilio Content Templates?
- ✅ **No 24-hour window issues** - Templates work anytime
- ✅ **Dynamic PDF URLs** - Can send different PDFs using the same template
- ✅ **Professional format** - Same Arabic text and WhatsApp link
- ✅ **Reliable delivery** - No "cannot start session" errors

## Step 1: Create Content Template in Twilio Console

1. **Go to Twilio Console**
   - Visit: https://console.twilio.com/
   - Navigate to: Messaging → Content Editor

2. **Create New Content Template**
   - Click "Create new content"
   - Select "WhatsApp" as the channel
   - Choose "Media Template" type

3. **Template Structure**
   ```
   Template Name: PDF Lab Results
   Category: UTILITY
   Language: Arabic (ar)
   
   Message Body:
   نتائج التحاليل خلصت وبعتنهالك هنا لو في اي استفسار عندك ممكن تكلمنا علي رقم الواتساب المخصص للاستفسارات والشكاوي.
   https://wa.me/201557000970
   
   Media:
   - Type: Document
   - Variable: {{1}} (for PDF URL)
   ```

4. **Template Variables**
   - `{{1}}` - PDF URL (will be replaced with your uploaded file URL)

## Step 2: Submit for WhatsApp Approval

1. **Review Template**
   - Check all text and media settings
   - Ensure Arabic text is correct
   - Verify WhatsApp link is included

2. **Submit for Approval**
   - Click "Submit for approval"
   - Wait for Meta (WhatsApp) approval
   - Usually takes under 1 hour, max 48 hours

3. **Get Template SID**
   - Once approved, copy the Template SID
   - Format: `HX1234567890abcdef...`
   - This is needed for the script

## Step 3: Configure Environment Variables

Add to your `.env.local` file:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+201100414204
```

## Step 4: Use the Script

```bash
# Send single PDF using Twilio template
node bird-tools/send-custom-pdf-twilio-template.js \
  --phone=+201557000970 \
  --template=HX1234567890abcdef \
  --file="D:\Results\20251012010240.pdf"

# Send all PDFs from folder
node bird-tools/send-custom-pdf-twilio-template.js \
  --phone=+201557000970 \
  --template=HX1234567890abcdef
```

## How It Works

1. **Upload PDF to Twilio Assets**
   - Your PDF is uploaded to Twilio's public storage
   - Gets a public URL that can be accessed by WhatsApp

2. **Send Template with PDF URL**
   - Uses your approved Content Template
   - Replaces `{{1}}` with the PDF URL
   - Sends via Twilio's WhatsApp API

3. **Result**
   - Recipient gets the template message
   - With your custom PDF attached
   - Same Arabic text and WhatsApp link
   - No 24-hour window issues

## Benefits Over Bird Approach

| Feature | Bird Templates | Twilio Content Templates |
|---------|----------------|--------------------------|
| 24-hour window | ❌ Required | ✅ Not required |
| Custom PDFs | ❌ Embedded only | ✅ Dynamic URLs |
| Delivery reliability | ❌ Session issues | ✅ Always works |
| Template approval | ✅ Required | ✅ Required |
| Setup complexity | ✅ Simple | ⚠️ More steps |

## Troubleshooting

### Template Not Approved
- Check template content for compliance
- Ensure Arabic text is correct
- Verify media type is "Document" not "Image"

### Upload Fails
- Check file size (max 16MB for WhatsApp)
- Ensure file is valid PDF
- Verify Twilio credentials

### Message Fails
- Verify template SID is correct
- Check phone number format
- Ensure template is approved and active

## Next Steps

1. Create the Content Template in Twilio Console
2. Submit for WhatsApp approval
3. Get the Template SID
4. Test with the script
5. Use for all your custom PDF sending needs

This approach will solve all the 24-hour window and session issues we've been experiencing!
