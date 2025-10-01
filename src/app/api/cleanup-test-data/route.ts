import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';
import { getTwilioClient } from '@/lib/twilio-service';

export async function POST() {
  try {
    console.log('🧹 Starting cleanup of test data...');
    
    const db = await getDatabase();
    let deletedContacts = 0;
    let deletedConversations = 0;
    
    // 1. Delete test contacts from database
    try {
      if (db.constructor.name === 'SQLiteDatabaseService') {
        const sqliteDb = db as any;
        if (sqliteDb.db) {
          const run = require('util').promisify(sqliteDb.db.run.bind(sqliteDb.db));
          
          // Delete contacts with test-related names or notes
          const result = await run(`
            DELETE FROM contacts 
            WHERE name LIKE 'Test User%' 
            OR notes LIKE '%test_endpoint%'
            OR notes LIKE '%Test contact created via test endpoint%'
          `);
          
          deletedContacts = result.changes || 0;
          console.log(`✅ Deleted ${deletedContacts} test contacts from database`);
        }
      } else {
        // For in-memory database
        const memoryDb = db as any;
        const contacts = Array.from(memoryDb.contacts.values());
        const testContacts = contacts.filter(contact => 
          contact.name?.startsWith('Test User') ||
          contact.notes?.includes('test_endpoint') ||
          contact.notes?.includes('Test contact created via test endpoint')
        );
        
        for (const contact of testContacts) {
          memoryDb.contacts.delete(contact.id);
          deletedContacts++;
        }
        console.log(`✅ Deleted ${deletedContacts} test contacts from memory database`);
      }
    } catch (error) {
      console.error('❌ Error deleting test contacts:', error);
    }
    
    // 2. Delete test conversations from Twilio
    try {
      const client = await getTwilioClient();
      
      // List all conversations
      const conversations = await client.conversations.v1.conversations.list({ limit: 50 });
      
      for (const conversation of conversations) {
        // Check if it's a test conversation
        const isTestConversation = 
          conversation.friendlyName?.includes('Test conversation') ||
          conversation.attributes?.includes('test_endpoint') ||
          conversation.attributes?.includes('"test":true');
        
        if (isTestConversation) {
          try {
            await client.conversations.v1.conversations(conversation.sid).remove();
            deletedConversations++;
            console.log(`✅ Deleted test conversation: ${conversation.sid}`);
          } catch (error) {
            console.error(`❌ Error deleting conversation ${conversation.sid}:`, error);
          }
        }
      }
      
      console.log(`✅ Deleted ${deletedConversations} test conversations from Twilio`);
    } catch (error) {
      console.error('❌ Error deleting test conversations:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test data cleanup completed',
      deletedContacts,
      deletedConversations,
      summary: `Removed ${deletedContacts} test contacts and ${deletedConversations} test conversations`
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test data', details: String(error) },
      { status: 500 }
    );
  }
}
