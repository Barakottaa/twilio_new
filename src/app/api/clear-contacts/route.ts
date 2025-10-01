import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function DELETE() {
  try {
    const db = await getDatabase();
    
    // Get all contacts first to show what we're deleting
    const allContacts = await db.getAllContacts();
    console.log('🗑️ Clearing all contacts:', allContacts.length, 'contacts found');
    
    // Clear all contacts by setting is_active = 0 (soft delete)
    // Note: This uses a direct SQL query since we don't have a clearAllContacts method
    if (db.constructor.name === 'SQLiteDatabaseService') {
      // For SQLite, we can access the db directly
      const sqliteDb = db as any;
      if (sqliteDb.db) {
        const run = require('util').promisify(sqliteDb.db.run.bind(sqliteDb.db));
        await run('UPDATE contacts SET is_active = 0, updated_at = ?', [new Date().toISOString()]);
        console.log('✅ All contacts cleared (soft delete)');
      }
    } else {
      // For in-memory database, clear the contacts map
      const memoryDb = db as any;
      if (memoryDb.contacts) {
        memoryDb.contacts.clear();
        console.log('✅ All contacts cleared from memory');
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${allContacts.length} contacts`,
      clearedCount: allContacts.length
    });
    
  } catch (error) {
    console.error('Error clearing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to clear contacts', details: error.message },
      { status: 500 }
    );
  }
}
