import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize phone number to always include + prefix
export function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove whatsapp: prefix if present
  let normalized = phoneNumber.replace(/^whatsapp:/, '');
  
  // Remove any spaces or special characters except +
  normalized = normalized.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add it
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}