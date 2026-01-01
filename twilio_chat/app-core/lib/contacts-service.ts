'use server';

import { getDatabase } from './database-config';
import type { Customer } from '@/types';

export async function getAllContacts(): Promise<Customer[]> {
  try {
    const db = await getDatabase();
    const contacts = await db.getAllContacts();
    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phoneNumber,
      lastSeen: contact.lastSeen
    }));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

export async function getContactById(id: string): Promise<Customer | null> {
  try {
    const db = await getDatabase();
    const contact = await db.getContact(id);
    if (!contact) return null;

    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phoneNumber,
      lastSeen: contact.lastSeen
    };
  } catch (error) {
    console.error('Error fetching contact:', error);
    return null;
  }
}

export async function createContact(data: {
  name: string;
  phoneNumber?: string;
  notes?: string;
  tags?: string[];
}): Promise<Customer | null> {
  try {
    const db = await getDatabase();
    const contact = await db.createContact({
      name: data.name,
      phone_number: data.phoneNumber,
      notes: data.notes,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=10b981&color=ffffff&size=150`
    });

    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phoneNumber,
      lastSeen: contact.lastSeen
    };
  } catch (error) {
    console.error('Error creating contact:', error);
    return null;
  }
}

export async function updateContact(id: string, data: {
  name?: string;
  phoneNumber?: string;
  notes?: string;
  tags?: string[];
}): Promise<Customer | null> {
  try {
    const db = await getDatabase();
    const contact = await db.updateContact(id, {
      name: data.name,
      phone_number: data.phoneNumber,
      notes: data.notes,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
      avatar: data.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=10b981&color=ffffff&size=150` : undefined
    });

    if (!contact) return null;

    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phoneNumber,
      lastSeen: contact.lastSeen
    };
  } catch (error) {
    console.error('Error updating contact:', error);
    return null;
  }
}

export async function deleteContact(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    return await db.deleteContact(id);
  } catch (error) {
    console.error('Error deleting contact:', error);
    return false;
  }
}

export async function findContactByPhone(phoneNumber: string): Promise<Customer | null> {
  try {
    const db = await getDatabase();
    const contact = await db.findContactByPhone(phoneNumber);
    if (!contact) return null;

    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phoneNumber,
      lastSeen: contact.lastSeen
    };
  } catch (error) {
    console.error('Error finding contact by phone:', error);
    return null;
  }
}

// Auto-create or update contact when new customer sends message
export async function autoCreateOrUpdateContact(data: {
  phoneNumber: string;
  name?: string;
  waId?: string;
  profileName?: string;
}): Promise<Customer | null> {
  try {
    const db = await getDatabase();

    // Check if contact already exists by phone number
    const existingContact = await db.findContactByPhone(data.phoneNumber);

    if (existingContact) {
      // Update existing contact with new information
      const updatedContact = await db.updateContact(existingContact.id, {
        name: data.name || data.profileName || existingContact.name,
        last_seen: new Date().toISOString(),
        avatar: data.name || data.profileName ?
          `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.profileName || '')}&background=10b981&color=ffffff&size=150` :
          existingContact.avatar
      });

      if (updatedContact) {
        console.log('✅ Updated existing contact:', { phoneNumber: data.phoneNumber, name: updatedContact.name });
        return {
          id: updatedContact.id,
          name: updatedContact.name,
          avatar: updatedContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedContact.name)}&background=10b981&color=ffffff&size=150`,
          phoneNumber: updatedContact.phoneNumber,
          email: updatedContact.email,
          lastSeen: updatedContact.lastSeen
        };
      }
    } else {
      // Create new contact
      const contactName = data.name || data.profileName || `WhatsApp ${data.phoneNumber}`;
      const newContact = await db.createContact({
        name: contactName,
        phone_number: data.phoneNumber,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=10b981&color=ffffff&size=150`,
        last_seen: new Date().toISOString(),
        tags: JSON.stringify(['auto-created', 'whatsapp'])
      });

      console.log('✅ Created new contact:', { phoneNumber: data.phoneNumber, name: contactName });
      return {
        id: newContact.id,
        name: newContact.name,
        avatar: newContact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newContact.name)}&background=10b981&color=ffffff&size=150`,
        phoneNumber: newContact.phoneNumber,
        email: newContact.email,
        lastSeen: newContact.lastSeen
      };
    }

    return null;
  } catch (error) {
    console.error('Error auto-creating/updating contact:', error);
    return null;
  }
}

/**
 * Gets a display name for a phone number (checks contacts first, then formats)
 */
export async function getDisplayName(phoneNumber: string): Promise<string> {
  if (!phoneNumber) return 'Unknown';

  const contact = await findContactByPhone(phoneNumber);
  if (contact) {
    return contact.name;
  }

  // Fallback to formatted phone number
  const { formatPhoneNumber } = await import('./utils');
  return formatPhoneNumber(phoneNumber);
}