import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';
import { getTwilioClient } from '@/lib/twilio-service';
import { autoCreateOrUpdateContact } from '@/lib/contacts-service';

export async function POST() {
  try {
    const db = await getDatabase();
    const client = await getTwilioClient();
    
    // Get all Twilio conversations
    const twilioConversations = await client.conversations.v1.conversations.list({ limit: 50 });
    console.log('📞 Found Twilio conversations:', twilioConversations.length);
    
    const results = {
      processed: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      errors: [] as string[]
    };
    
    // Process each conversation
    for (const conv of twilioConversations) {
      try {
        results.processed++;
        
        // Get participants for this conversation
        const participants = await client.conversations.v1
          .conversations(conv.sid)
          .participants.list();
        
        // Find customer participant
        const customerParticipant = participants.find(p => {
          if (!p.identity) {
            return p.messagingBinding && p.messagingBinding.type === 'whatsapp';
          }
          return !p.identity.startsWith('agent-') && !p.identity.startsWith('admin-');
        });
        
        if (customerParticipant) {
          // Extract phone number
          const phoneNumber = customerParticipant.messagingBinding?.address?.replace('whatsapp:', '');
          
          if (phoneNumber) {
            console.log('🔍 Processing conversation:', conv.sid, 'Phone:', phoneNumber);
            
            // Check if contact already exists
            const existingContact = await db.findContactByPhone(phoneNumber);
            
            if (!existingContact) {
              // Create new contact
              let contactName = 'Unknown Customer';
              let profileName = '';
              
              // Try to get name from participant attributes
              try {
                const attributes = customerParticipant.attributes ? 
                  JSON.parse(customerParticipant.attributes) : {};
                profileName = attributes.display_name || attributes.profile_name || '';
                if (profileName) {
                  contactName = profileName;
                }
              } catch (error) {
                console.log('Could not parse participant attributes:', error);
              }
              
              // Create contact
              const newContact = await autoCreateOrUpdateContact({
                phoneNumber,
                name: contactName,
                waId: phoneNumber.replace('+', ''),
                profileName: profileName || contactName
              });
              
              if (newContact) {
                results.contactsCreated++;
                console.log('✅ Created contact:', newContact.name, 'for phone:', phoneNumber);
              } else {
                results.errors.push(`Failed to create contact for phone: ${phoneNumber}`);
              }
            } else {
              // Update existing contact's last seen
              await db.updateContact(existingContact.id, {
                lastSeen: new Date().toISOString()
              });
              results.contactsUpdated++;
              console.log('✅ Updated contact:', existingContact.name, 'for phone:', phoneNumber);
            }
          } else {
            results.errors.push(`No phone number found for conversation: ${conv.sid}`);
          }
        } else {
          results.errors.push(`No customer participant found for conversation: ${conv.sid}`);
        }
      } catch (error) {
        results.errors.push(`Error processing conversation ${conv.sid}: ${error.message}`);
        console.error('Error processing conversation:', conv.sid, error);
      }
    }
    
    // Get final contact count
    const finalContacts = await db.getAllContacts();
    
    return NextResponse.json({
      success: true,
      results,
      finalContactCount: finalContacts.length,
      message: `Sync completed. Processed ${results.processed} conversations, created ${results.contactsCreated} contacts, updated ${results.contactsUpdated} contacts.`
    });
    
  } catch (error) {
    console.error('Error syncing contacts:', error);
    return NextResponse.json(
      { error: 'Failed to sync contacts', details: error.message },
      { status: 500 }
    );
  }
}
