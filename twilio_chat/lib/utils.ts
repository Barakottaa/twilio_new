import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize phone number to always include + prefix
// Handles Egyptian numbers: 01557000970 → +201557000970
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove whatsapp: prefix if present
  let normalized = phoneNumber.replace(/^whatsapp:/i, '').trim();
  
  // Remove any spaces, dashes, parentheses, but keep + and digits
  normalized = normalized.replace(/[\s\-\(\)]/g, '');
  
  // If it already starts with +, check if it's valid
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // Handle Egyptian numbers (starting with 0 or 1)
  // Pattern: 01557000970 → +201557000970
  // Pattern: 1557000970 → +201557000970
  if (normalized.startsWith('0')) {
    // Remove leading 0 and add +20 (Egypt country code)
    normalized = '+20' + normalized.substring(1);
  } else if (normalized.startsWith('1') && normalized.length === 10) {
    // If it's 10 digits starting with 1, assume Egyptian number
    normalized = '+20' + normalized;
  } else {
    // For other numbers, just add +
    normalized = '+' + normalized;
  }
  
  return normalized;
}