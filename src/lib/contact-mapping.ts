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
  contactMapping.set(phoneNumber, {
    phoneNumber,
    name,
    avatar,
    lastSeen: new Date().toISOString()
  });
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

// Initialize with some sample contacts (remove in production)
export function initializeSampleContacts() {
  addContact('+201016666348', 'Ahmed Hassan', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face');
  addContact('+1234567890', 'John Smith', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');
  addContact('+9876543210', 'Sarah Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
}

// Initialize sample contacts on module load
initializeSampleContacts();
