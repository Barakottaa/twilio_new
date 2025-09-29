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
      phoneNumber: contact.phone_number,
      email: contact.email,
      lastSeen: contact.last_seen
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
      phoneNumber: contact.phone_number,
      email: contact.email,
      lastSeen: contact.last_seen
    };
  } catch (error) {
    console.error('Error fetching contact:', error);
    return null;
  }
}

export async function createContact(data: {
  name: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;
  tags?: string[];
}): Promise<Customer | null> {
  try {
    const db = await getDatabase();
    const contact = await db.createContact({
      name: data.name,
      phone_number: data.phoneNumber,
      email: data.email,
      notes: data.notes,
      tags: data.tags ? data.tags.join(',') : undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=10b981&color=ffffff&size=150`
    });

    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phone_number,
      email: contact.email,
      lastSeen: contact.last_seen
    };
  } catch (error) {
    console.error('Error creating contact:', error);
    return null;
  }
}

export async function updateContact(id: string, data: {
  name?: string;
  phoneNumber?: string;
  email?: string;
  notes?: string;
  tags?: string[];
}): Promise<Customer | null> {
  try {
    const db = await getDatabase();
    const contact = await db.updateContact(id, {
      name: data.name,
      phone_number: data.phoneNumber,
      email: data.email,
      notes: data.notes,
      tags: data.tags ? data.tags.join(',') : undefined,
      avatar: data.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=10b981&color=ffffff&size=150` : undefined
    });

    if (!contact) return null;

    return {
      id: contact.id,
      name: contact.name,
      avatar: contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=10b981&color=ffffff&size=150`,
      phoneNumber: contact.phone_number,
      email: contact.email,
      lastSeen: contact.last_seen
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
      phoneNumber: contact.phone_number,
      email: contact.email,
      lastSeen: contact.last_seen
    };
  } catch (error) {
    console.error('Error finding contact by phone:', error);
    return null;
  }
}
