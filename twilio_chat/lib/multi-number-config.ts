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
          numbers.push({
            id: i.toString(),
            number: number.replace('whatsapp:', ''),
            name: `Number ${i}`,
            department: 'General',
            isActive: true
          });
        }
      }
      
      return numbers;
    }
    
    const parsedConfig: NumbersConfig = JSON.parse(config);
    return parsedConfig.numbers.filter(n => n.isActive);
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
  const normalizedPhone = phoneNumber.replace('whatsapp:', '').replace('+', '');
  return numbers.find(n => n.number.replace('+', '') === normalizedPhone) || null;
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
