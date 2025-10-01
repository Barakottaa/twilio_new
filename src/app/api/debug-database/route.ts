import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get all contacts (including inactive ones)
    let allContacts = [];
    if (db.constructor.name === 'SQLiteDatabaseService') {
      const sqliteDb = db as any;
      if (sqliteDb.db) {
        const all = require('util').promisify(sqliteDb.db.all.bind(sqliteDb.db));
        allContacts = await all('SELECT * FROM contacts ORDER BY created_at DESC');
      }
    } else {
      // For in-memory database
      const memoryDb = db as any;
      allContacts = Array.from(memoryDb.contacts.values());
    }
    
    // Get only active contacts (what the UI shows)
    const activeContacts = await db.getAllContacts();
    
    return NextResponse.json({
      totalContactsInDatabase: allContacts.length,
      activeContacts: activeContacts.length,
      inactiveContacts: allContacts.length - activeContacts.length,
      allContacts: allContacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phone_number,
        email: contact.email,
        isActive: contact.is_active,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      })),
      activeContactsList: activeContacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber
      }))
    });
    
  } catch (error) {
    console.error('Error debugging database:', error);
    return NextResponse.json(
      { error: 'Failed to debug database', details: String(error) },
      { status: 500 }
    );
  }
}
