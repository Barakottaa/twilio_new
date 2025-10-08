// Contact mapping system for WhatsApp contacts
// Since Twilio doesn't provide contact names, we maintain our own mapping
// This now works alongside the database for better performance

export interface ContactInfo {
  phoneNumber: string;
  name: string;
  avatar?: string;
  lastSeen?: string;
}

// Simple in-memory contact mapping for fast lookups
// This is now synchronized with the database
const contactMapping = new Map<string, ContactInfo>();

// Add a contact to the mapping
export function addContact(phoneNumber: string, name: string, avatar?: string) {
  const existingContact = contactMapping.get(phoneNumber);
  const lastSeen = existingContact?.lastSeen || new Date().toISOString();
  
  contactMapping.set(phoneNumber, {
    phoneNumber,
    name,
    avatar,
    lastSeen
  });
  
  console.log('📝 Contact added/updated:', { phoneNumber, name, avatar, lastSeen });
}

// Get contact info by phone number
export function getContact(phoneNumber: string): ContactInfo | null {
  return contactMapping.get(phoneNumber) || null;
}

// Get all contacts
export function getAllContacts(): ContactInfo[] {
  return Array.from(contactMapping.values());
}

// Update contact last seen
export function updateLastSeen(phoneNumber: string) {
  const contact = contactMapping.get(phoneNumber);
  if (contact) {
    contact.lastSeen = new Date().toISOString();
  }
}

// Format phone number for display
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove whatsapp: prefix if present
  const cleanNumber = phoneNumber.replace(/^whatsapp:/, '');
  
  // Format: +20 10 1666 6348 (12 digits)
  if (cleanNumber.match(/^\+\d{12}$/)) {
    return cleanNumber.replace(/(\+\d{2})(\d{2})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // Format: +1 234 567 8901 (11 digits)
  if (cleanNumber.match(/^\+\d{11}$/)) {
    return cleanNumber.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // Format: +123 456 7890 (10 digits)
  if (cleanNumber.match(/^\+\d{10}$/)) {
    return cleanNumber.replace(/(\+\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return cleanNumber;
}

// Get display name for a phone number
export function getDisplayName(phoneNumber: string): string {
  const contact = getContact(phoneNumber);
  if (contact) {
    return contact.name;
  }
  
  // Fallback to formatted phone number
  return formatPhoneNumber(phoneNumber);
}

// Initialize with empty contacts - we'll get real data from Twilio webhook
export function initializeSampleContacts() {
  // No mock data - we'll get real contact info from Twilio webhook
}

// Initialize contact mapping on module load
initializeSampleContacts();
