# 🕊️ Flexible Template System

## 📋 Overview

The Bird service now supports a flexible template system where you can define multiple templates with their parameters in the `.env` file.

## 🔧 Configuration

### Environment Variables Format

```env
# Template Configuration
TEMPLATE_NAME_PROJECT_ID=your-project-id
TEMPLATE_NAME_VERSION_ID=your-version-id
TEMPLATE_NAME_PARAMETERS=param1,param2,param3
```

### Example Configuration

```env
# Invoice Template
INVOICE_TEMPLATE_PROJECT_ID=3c476178-73f1-4eb3-b3a8-e885575fd3be
INVOICE_TEMPLATE_VERSION_ID=6abf0d77-c3cc-448e-a7c2-6b60f272235e
INVOICE_TEMPLATE_PARAMETERS=patient_name,lab_no,total_cost

# Welcome Template
WELCOME_TEMPLATE_PROJECT_ID=your-welcome-project-id
WELCOME_TEMPLATE_VERSION_ID=your-welcome-version-id
WELCOME_TEMPLATE_PARAMETERS=customer_name,appointment_date

# Reminder Template
REMINDER_TEMPLATE_PROJECT_ID=your-reminder-project-id
REMINDER_TEMPLATE_VERSION_ID=your-reminder-version-id
REMINDER_TEMPLATE_PARAMETERS=patient_name,appointment_time,doctor_name
```

## 🚀 Usage

### 1. Flexible Template Endpoint

**URL**: `POST /api/send-template/:templateName`

**Example**: Send invoice template
```bash
curl -X POST http://localhost:8080/bird/api/send-template/invoice \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+201100414204",
    "data": {
      "patient_name": "عبدالرحمن",
      "lab_no": "1",
      "total_cost": "400"
    }
  }'
```

**Example**: Send welcome template
```bash
curl -X POST http://localhost:8080/bird/api/send-template/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+201100414204",
    "data": {
      "customer_name": "أحمد",
      "appointment_date": "2025-10-15"
    }
  }'
```

### 2. Backward Compatibility

The old invoice endpoint still works:
```bash
curl -X POST http://localhost:8080/bird/api/send-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+201100414204",
    "invoiceData": {
      "patientName": "عبدالرحمن",
      "labNo": "1",
      "totalPaid": "400"
    }
  }'
```

## 📝 Adding New Templates

### Step 1: Add to .env file
```env
# New Template
MY_TEMPLATE_PROJECT_ID=your-project-id
MY_TEMPLATE_VERSION_ID=your-version-id
MY_TEMPLATE_PARAMETERS=param1,param2,param3
```

### Step 2: Send the template
```bash
curl -X POST http://localhost:8080/bird/api/send-template/my_template \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+201100414204",
    "data": {
      "param1": "value1",
      "param2": "value2",
      "param3": "value3"
    }
  }'
```

## 🔄 Default Values

If a parameter is not provided, the system uses default values:

```javascript
const defaults = {
  'patient_name': 'عبدالرحمن',
  'customer_name': 'عميل',
  'lab_no': '1',
  'total_cost': '400',
  'appointment_date': new Date().toLocaleDateString('ar-EG'),
  'appointment_time': '10:00 ص',
  'doctor_name': 'د. أحمد بركة'
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Template not found**: Check if template configuration exists in `.env`
2. **Parameter mismatch**: Ensure parameter names match exactly
3. **Invalid template**: Verify template IDs are correct in Bird dashboard

### Debug Commands

```bash
# Check service health
curl http://localhost:3001/health

# Check logs
pm2 logs bird-service

# Test template
curl -X POST http://localhost:8080/bird/api/send-template/invoice \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+201100414204", "data": {}}'
```

## 📊 Benefits

- ✅ **Easy to add new templates** - Just add to `.env` file
- ✅ **Flexible parameters** - Define any number of parameters
- ✅ **Default values** - Automatic fallbacks for missing data
- ✅ **Backward compatible** - Old endpoints still work
- ✅ **Centralized configuration** - All templates in one place
