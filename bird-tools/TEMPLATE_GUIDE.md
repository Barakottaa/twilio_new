# 🚀 Bird Template System Guide

## Overview
This system allows you to send any Bird WhatsApp template with different structures using simple Node.js scripts.

## 🛠️ Available Tools

### 1. Universal Template Sender (`send-any-template.js`)
Send any template with different parameters and structures.

### 2. Template Configuration Manager (`add-template.js`)
Add new templates to the system easily.

### 3. Template Configurations (`template-configs.json`)
JSON file containing all template definitions.

## 📋 How to Use

### Send Existing Templates

#### Invoice Template (Working Example)
```bash
node send-any-template.js invoice --phone=+201100414204 --name="عبدالرحمن" --lab=3 --paid=600 --remaining=200
```

#### Appointment Template
```bash
node send-any-template.js appointment --phone=+201100414204 --name="أحمد" --date="2025-10-20" --time="10:00" --doctor="د. محمد"
```

#### Lab Results Template
```bash
node send-any-template.js lab_results --phone=+201100414204 --name="فاطمة" --lab=5 --test="تحليل دم" --date="2025-10-20"
```

### Send Custom Templates
```bash
node send-any-template.js custom --phone=+201100414204 --project=your-project-id --version=your-version-id --param1="value1" --param2="value2"
```

## 🔧 Adding New Templates

### Method 1: Using the Template Manager
```bash
# List all templates
node add-template.js list

# Add new template
node add-template.js my_new_template
```

### Method 2: Manual Configuration
Edit `template-configs.json` directly:

```json
{
  "my_template": {
    "name": "My Custom Template",
    "projectId": "your-project-id",
    "version": "your-version-id",
    "parameters": ["param1", "param2", "param3"],
    "defaults": {
      "param1": "default1",
      "param2": "default2",
      "param3": "default3"
    },
    "description": "Description of your template"
  }
}
```

## 📊 Template Structure

Each template configuration includes:

- **name**: Display name for the template
- **projectId**: Bird template project ID
- **version**: Bird template version ID
- **parameters**: Array of parameter names in correct order
- **defaults**: Default values for each parameter
- **description**: What the template is used for

## ⚠️ Important Notes

### Parameter Order
**CRITICAL**: Parameters must be in the exact same order as defined in your Bird template. WhatsApp templates are positional, not key-value based.

### Template IDs
You need to get the correct `projectId` and `version` from your Bird Studio dashboard.

### Testing
Always test with a small example first:
```bash
node send-any-template.js invoice --phone=+201100414204 --name="Test" --lab=1 --paid=100 --remaining=50
```

## 🎯 Examples for Different Use Cases

### Medical Lab
```bash
# Invoice with payment
node send-any-template.js invoice --phone=+201100414204 --name="عبدالرحمن" --lab=3 --paid=600 --remaining=200

# Lab results ready
node send-any-template.js lab_results --phone=+201100414204 --name="فاطمة" --lab=5 --test="تحليل شامل" --date="2025-10-20"

# Appointment reminder
node send-any-template.js appointment --phone=+201100414204 --name="أحمد" --date="2025-10-20" --time="10:00" --doctor="د. محمد"
```

### E-commerce
```bash
# Order confirmation
node send-any-template.js custom --phone=+201100414204 --project=order-project-id --version=order-version-id --order_id="12345" --total="500" --delivery="2025-10-20"

# Payment confirmation
node send-any-template.js payment_confirmation --phone=+201100414204 --name="عميل" --amount="500" --method="فودافون كاش" --transaction="TXN123"
```

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid parameter" error**
   - Check parameter order matches template definition
   - Verify parameter names are correct

2. **"Template not found" error**
   - Verify projectId and version are correct
   - Check template is approved in Bird Studio

3. **"Malformed request" error**
   - Check JSON structure
   - Verify all required fields are present

### Debug Mode
Add `--debug` flag to see full request payload:
```bash
node send-any-template.js invoice --phone=+201100414204 --name="Test" --debug
```

## 📱 WhatsApp Integration

### Buttons and Actions
Templates with buttons will show them automatically. Click them to test webhook functionality.

### Webhook Testing
After sending a template with buttons, click them to test your webhook endpoint.

## 🚀 Next Steps

1. **Add your templates**: Use `add-template.js` or edit `template-configs.json`
2. **Test each template**: Send test messages to verify they work
3. **Integrate with your app**: Use the Node.js functions in your application
4. **Set up webhooks**: Handle button clicks and responses

## 📞 Support

If you need help:
1. Check the logs: `pm2 logs bird-service`
2. Test with direct API calls first
3. Verify template IDs in Bird Studio
4. Check parameter order matches template definition
