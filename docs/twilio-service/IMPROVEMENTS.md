# Recommended Improvements for twilio-service

Based on analysis of `twilio_chat` architecture, here are actionable improvements.

## 1. Multi-Number Configuration Support

**File**: `lib/multi-number-config.js`

```javascript
// Support multiple Twilio numbers
export function getConfiguredNumbers() {
  const config = process.env.TWILIO_NUMBERS_CONFIG;
  if (config) {
    try {
      return JSON.parse(config).numbers.filter(n => n.isActive);
    } catch (e) {
      console.error('Invalid TWILIO_NUMBERS_CONFIG:', e);
    }
  }
  
  // Fallback: single number from env
  const defaultNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  return defaultNumber ? [{
    id: '1',
    number: defaultNumber.replace('whatsapp:', ''),
    name: 'Default',
    department: 'General',
    isActive: true
  }] : [];
}

export function getNumberById(id) {
  return getConfiguredNumbers().find(n => n.id === id);
}

export function getDefaultNumber() {
  return getConfiguredNumbers()[0] || null;
}

export function getWhatsAppNumber(phoneNumber) {
  return phoneNumber.startsWith('whatsapp:') 
    ? phoneNumber 
    : `whatsapp:${phoneNumber}`;
}
```

**Usage in twilio-api-client.js**:
```javascript
const { getNumberById, getDefaultNumber, getWhatsAppNumber } = require('./lib/multi-number-config');

async sendMessage(to, text, fromNumberId = null) {
  let fromNumber;
  if (fromNumberId) {
    const number = getNumberById(fromNumberId);
    fromNumber = number ? getWhatsAppNumber(number.number) : null;
  }
  fromNumber = fromNumber || getWhatsAppNumber(
    getDefaultNumber()?.number || this.whatsappNumber || '+14155238886'
  );
  // ... rest of send logic
}
```

---

## 2. Enhanced Error Handling

**File**: `lib/error-handler.js`

```javascript
class TwilioError extends Error {
  constructor(message, code, status, context) {
    super(message);
    this.name = 'TwilioError';
    this.code = code;
    this.status = status;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export function handleTwilioError(error, context = {}) {
  const errorDetails = {
    message: error.message,
    code: error.code,
    status: error.status,
    moreInfo: error.moreInfo,
    context: context,
    timestamp: new Date().toISOString()
  };
  
  // Log with context
  console.error('❌ Twilio Error:', JSON.stringify(errorDetails, null, 2));
  
  // Return structured error
  return {
    success: false,
    error: error.message || 'Unknown error',
    code: error.code,
    status: error.status,
    // Include details in development
    ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
  };
}

export function wrapTwilioCall(asyncFn, context) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      return handleTwilioError(error, { ...context, args });
    }
  };
}
```

**Usage**:
```javascript
const { wrapTwilioCall } = require('./lib/error-handler');

async sendMessage(to, text) {
  return wrapTwilioCall(async () => {
    // ... send logic
  }, { operation: 'sendMessage', to, text })();
}
```

---

## 3. Caching Layer

**File**: `lib/cache-service.js`

```javascript
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > (entry.ttl || this.defaultTTL)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Cache patient folder lookup
  getPatientFolder(phoneNumber) {
    return this.get(`patient_folder:${phoneNumber}`);
  }

  setPatientFolder(phoneNumber, folderPath) {
    this.set(`patient_folder:${phoneNumber}`, folderPath, 10 * 60 * 1000); // 10 min
  }
}

module.exports = new CacheService();
```

**Usage in pdf-to-image-service.js**:
```javascript
const cache = require('./lib/cache-service');

async processPdfFromFolder(phoneNumber) {
  // Check cache first
  const cachedFolder = cache.getPatientFolder(phoneNumber);
  if (cachedFolder && fs.existsSync(cachedFolder)) {
    console.log('📦 Using cached folder:', cachedFolder);
    // Use cached folder
  }
  
  // ... find folder logic
  
  // Cache result
  cache.setPatientFolder(phoneNumber, folderPath);
}
```

---

## 4. Enhanced Configuration Validation

**File**: `lib/config-validator.js`

```javascript
export function validateTwilioConfig() {
  const issues = [];
  const warnings = [];
  
  // Required checks
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid) {
    issues.push('TWILIO_ACCOUNT_SID is required');
  } else if (!accountSid.startsWith('AC')) {
    issues.push('TWILIO_ACCOUNT_SID must start with "AC"');
  }
  
  if (!authToken) {
    issues.push('TWILIO_AUTH_TOKEN is required');
  } else if (authToken.length < 32) {
    warnings.push('TWILIO_AUTH_TOKEN seems too short (should be 32+ characters)');
  }
  
  // Optional but recommended
  if (!process.env.TWILIO_WHATSAPP_NUMBER) {
    warnings.push('TWILIO_WHATSAPP_NUMBER not set, will use default');
  }
  
  // PDF base dir
  const pdfBaseDir = process.env.PDF_BASE_DIR || "D:\\Results";
  if (!fs.existsSync(pdfBaseDir)) {
    issues.push(`PDF_BASE_DIR does not exist: ${pdfBaseDir}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    config: {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'Not configured',
      pdfBaseDir
    }
  };
}
```

---

## 5. Service Layer Reorganization

**Recommended Structure**:
```
twilio-service/
  lib/
    twilio-client.js        # Core Twilio API client
    pdf-service.js          # PDF conversion logic
    cache-service.js        # Caching utilities
    error-handler.js        # Error handling
    config-validator.js     # Configuration validation
    multi-number-config.js  # Multi-number support
  listener.js               # Express server
  package.json
```

**Benefits**:
- Better code organization
- Easier testing
- Clear separation of concerns
- Reusable modules

---

## Implementation Checklist

### Phase 1: Quick Wins (30 minutes)
- [ ] Add enhanced error handling
- [ ] Improve configuration validation
- [ ] Add structured logging

### Phase 2: Features (1-2 hours)
- [ ] Implement multi-number support
- [ ] Add caching layer
- [ ] Reorganize into service modules

### Phase 3: Advanced (If Needed)
- [ ] Add database persistence (SQLite)
- [ ] Add contact management
- [ ] Add delivery status tracking

---

## Environment Variables

Add to `.env`:
```env
# Multi-number support (optional)
TWILIO_NUMBERS_CONFIG='{"numbers":[{"id":"1","number":"+1234567890","name":"Main","department":"General","isActive":true}]}'

# Or use single number
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

---

## Notes

- **Keep it simple**: Don't add features you don't need
- **Start with error handling**: Most impactful improvement
- **Caching is optional**: Only if you see performance issues
- **Multi-number**: Only if you actually need multiple numbers

