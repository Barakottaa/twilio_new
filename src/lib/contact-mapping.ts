// Contact mapping system for WhatsApp contacts
// Since Twilio doesn't provide contact names, we maintain our own mapping

export interface ContactInfo {
  phoneNumber: string;
  name: string;
  avatar?: string;
  lastSeen?: string;
}

// Simple in-memory contact mapping
// In production, this should be stored in a database
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

// Initialize with empty contacts - we'll get real data from Meta
export function initializeSampleContacts() {
  console.log('🔄 Contact mapping initialized - no mock data');
  
  // Add some sample contacts for testing
  addContact('+201016666348', 'Ahmed Hassan', 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=random');
  addContact('+201557000970', 'Sarah Johnson', 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random');
  addContact('+201234567890', 'Mohamed Ali', 'https://ui-avatars.com/api/?name=Mohamed+Ali&background=random');
  
  console.log('📋 Added sample contacts for testing');
}

// Initialize contact mapping on module load
initializeSampleContacts();
