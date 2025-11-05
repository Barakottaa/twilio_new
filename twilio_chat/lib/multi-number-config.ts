// Multi-Number Configuration Utility
export interface TwilioNumber {
  id: string;
  number: string;
  name: string;
  department: string;
  isActive: boolean;
}

export interface NumbersConfig {
  numbers: TwilioNumber[];
}

// Get all configured numbers
export function getConfiguredNumbers(): TwilioNumber[] {
  try {
    const config = process.env.TWILIO_NUMBERS_CONFIG;
    if (!config) {
      // Fallback to individual environment variables
      const numbers: TwilioNumber[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const number = process.env[`TWILIO_WHATSAPP_NUMBER_${i}`];
        if (number) {
          // Remove 'whatsapp:' prefix if present, but keep the + sign
          const cleanNumber = number.replace(/^whatsapp:/i, '');
          numbers.push({
            id: i.toString(),
            number: cleanNumber,
            name: `Number ${i}`,
            department: 'General',
            isActive: true
          });
          console.log(`📋 Loaded number ${i}: ${cleanNumber}`);
        }
      }
      
      console.log(`📋 Total configured numbers: ${numbers.length}`);
      return numbers;
    }
    
    const parsedConfig: NumbersConfig = JSON.parse(config);
    const activeNumbers = parsedConfig.numbers.filter(n => n.isActive);
    console.log(`📋 Loaded ${activeNumbers.length} numbers from TWILIO_NUMBERS_CONFIG`);
    return activeNumbers;
  } catch (error) {
    console.error('Error parsing TWILIO_NUMBERS_CONFIG:', error);
    return [];
  }
}

// Get a specific number by ID
export function getNumberById(id: string): TwilioNumber | null {
  const numbers = getConfiguredNumbers();
  return numbers.find(n => n.id === id) || null;
}

// Get a number by phone number
export function getNumberByPhone(phoneNumber: string): TwilioNumber | null {
  const numbers = getConfiguredNumbers();
  // Normalize both: remove 'whatsapp:' prefix but keep '+' sign for comparison
  // Twilio sends proxyAddress as "whatsapp:+1234567890"
  // Our config might have "+1234567890" or "whatsapp:+1234567890"
  const normalizedPhone = phoneNumber.replace(/^whatsapp:/i, '').trim();
  
  const matched = numbers.find(n => {
    // Normalize configured number (remove whatsapp: if present)
    const normalizedConfig = n.number.replace(/^whatsapp:/i, '').trim();
    // Compare: both should have + sign
    const match = normalizedConfig === normalizedPhone;
    if (!match) {
      // Try without + sign as fallback
      return normalizedConfig.replace(/^\+/, '') === normalizedPhone.replace(/^\+/, '');
    }
    return match;
  });
  
  if (matched) {
    console.log(`✅ Number matched: ${phoneNumber} → ${matched.name} (${matched.number})`);
  } else {
    console.warn(`⚠️ No match for: ${phoneNumber}. Available:`, numbers.map(n => n.number));
  }
  
  return matched || null;
}

// Get default number (first active number)
export function getDefaultNumber(): TwilioNumber | null {
  const numbers = getConfiguredNumbers();
  return numbers[0] || null;
}

// Get numbers by department
export function getNumbersByDepartment(department: string): TwilioNumber[] {
  const numbers = getConfiguredNumbers();
  return numbers.filter(n => n.department === department);
}

// Validate if a number is configured
export function isNumberConfigured(phoneNumber: string): boolean {
  return getNumberByPhone(phoneNumber) !== null;
}

// Get WhatsApp formatted number
export function getWhatsAppNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith('whatsapp:')) {
    return phoneNumber;
  }
  return `whatsapp:${phoneNumber}`;
}
