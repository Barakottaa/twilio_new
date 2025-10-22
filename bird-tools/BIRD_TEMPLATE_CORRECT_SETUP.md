# Bird Template Setup Guide (Correct PDF Variable Usage)

## Overview
This guide explains how to create Bird templates with PDF variables that comply with WhatsApp's guidelines and avoid the "Unable to parse content" rejection.

## Why Templates Get Rejected

The error "Unable to parse content" occurs when:
- ❌ Variable is used in the domain part of the URL
- ❌ No sample value is provided during template creation
- ❌ Sample URL doesn't resolve to a real, accessible PDF
- ❌ File type is not PDF

## Correct Template Structure

### ✅ **Correct Media URL Format:**
```
https://yourdomain.com/pdfs/{{1}}
```

### ✅ **Sample Variable Value:**
```
sample.pdf
```

### ✅ **Combined Sample URL (must be real and accessible):**
```
https://yourdomain.com/pdfs/sample.pdf
```

## Step 1: Set Up Static Domain for PDF Hosting

You need a static domain to host your PDFs. Options:

### Option A: Your Own Web Server
```bash
# Upload PDFs to your web server
# Example: https://yourdomain.com/pdfs/filename.pdf
```

### Option B: AWS S3 with Custom Domain
```bash
# Configure S3 bucket with your domain
# Example: https://pdfs.yourdomain.com/filename.pdf
```

### Option C: Any Static File Hosting
```bash
# Use services like Netlify, Vercel, etc.
# Example: https://yourdomain.netlify.app/pdfs/filename.pdf
```

## Step 2: Create Bird Template with Correct Structure

1. **Go to Bird Console**
   - Visit: https://app.bird.com/
   - Navigate to: Templates management

2. **Create New Template**
   - Template Name: `PDF Lab Results`
   - Category: `Utility`
   - Language: `Arabic (ar)`

3. **Template Content**
   ```
   Message Body:
   نتائج التحاليل خلصت وبعتنهالك هنا لو في اي استفسار عندك ممكن تكلمنا علي رقم الواتساب المخصص للاستفسارات والشكاوي.
   https://wa.me/201557000970
   
   Media:
   - Type: Document
   - URL: https://yourdomain.com/pdfs/{{1}}
   - Sample Value: sample.pdf
   ```

4. **Important: Sample Value**
   - Must be a real PDF filename
   - The combined URL must be accessible
   - Example: `https://yourdomain.com/pdfs/sample.pdf`

## Step 3: Upload Sample PDF

Before submitting for approval, ensure:
1. Upload `sample.pdf` to your domain
2. URL `https://yourdomain.com/pdfs/sample.pdf` is accessible
3. File is valid PDF under 16MB

## Step 4: Submit for Approval

1. **Review Template**
   - Check media URL structure
   - Verify sample value
   - Ensure Arabic text is correct

2. **Submit for Approval**
   - Click "Submit for approval"
   - Wait for Meta (WhatsApp) approval
   - Usually takes under 1 hour

## Step 5: Use the Script

```bash
# Send custom PDF using Bird template with correct variable structure
node bird-tools/send-custom-pdf-bird-correct.js \
  --phone=+201557000970 \
  --template-project=1c05f3a5-c35a-404f-9ac8-7af994fbeab1 \
  --template-version=8204340b-2e66-450c-b0ea-be89d5a24235 \
  --domain=https://yourdomain.com \
  --file="D:\Results\20251012010240.pdf"
```

## How It Works

1. **Upload PDF to Static Domain**
   - Your PDF is uploaded to your static domain
   - Gets a URL like: `https://yourdomain.com/pdfs/filename.pdf`

2. **Send Template with PDF URL**
   - Uses your approved Bird template
   - Replaces `{{1}}` with the PDF URL
   - Sends via Bird's WhatsApp API

3. **Result**
   - Recipient gets the template message
   - With your custom PDF attached
   - Same Arabic text and WhatsApp link

## Common Mistakes to Avoid

### ❌ **Incorrect Examples:**
```
# Domain as variable (NOT ALLOWED)
https://{{1}}/pdfs/filename.pdf

# No sample value (NOT ALLOWED)
https://yourdomain.com/pdfs/{{1}} (no sample provided)

# Non-PDF file (NOT ALLOWED)
https://yourdomain.com/pdfs/{{1}}.docx

# Sample URL not accessible (NOT ALLOWED)
https://yourdomain.com/pdfs/sample.pdf (file doesn't exist)
```

### ✅ **Correct Examples:**
```
# Static domain, variable in path
https://yourdomain.com/pdfs/{{1}}
Sample: invoice123.pdf
Combined: https://yourdomain.com/pdfs/invoice123.pdf

# Static domain, variable in filename
https://yourdomain.com/reports/{{1}}
Sample: report.pdf
Combined: https://yourdomain.com/reports/report.pdf
```

## Implementation Notes

The script includes a placeholder `uploadToStaticDomain()` function that you need to implement based on your hosting solution:

```javascript
// You need to implement this function
async function uploadToStaticDomain(filePath, domain) {
  // Upload logic for your specific hosting solution
  // Return: { url: "https://yourdomain.com/pdfs/filename.pdf", filename: "filename.pdf" }
}
```

## Benefits

- ✅ **Compliant with WhatsApp guidelines**
- ✅ **No template rejection issues**
- ✅ **Dynamic PDF URLs supported**
- ✅ **Professional template format**
- ✅ **Reliable delivery**

## Next Steps

1. Set up static domain for PDF hosting
2. Create Bird template with correct variable structure
3. Upload sample PDF for approval
4. Submit template for WhatsApp approval
5. Implement upload function in the script
6. Test with your custom PDFs

This approach will solve the "Unable to parse content" rejection and allow you to send custom PDFs via Bird templates!
