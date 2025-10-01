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
          // Extract phone number from messagingBinding.address (customer's actual phone)
          let phoneNumber = '';
          let waId = '';
          
          // Use messagingBinding.address for customer phone number
          if (customerParticipant.messagingBinding?.address) {
            phoneNumber = customerParticipant.messagingBinding.address.replace('whatsapp:', '');
          }
          
          // Use messagingBinding.proxy_address as WhatsApp ID (your Twilio number)
          if (customerParticipant.messagingBinding?.proxy_address) {
            waId = customerParticipant.messagingBinding.proxy_address.replace('whatsapp:', '');
          }
          
          // Fallback to identity if no messagingBinding
          if (!phoneNumber && customerParticipant.identity) {
            if (customerParticipant.identity.startsWith('whatsapp:')) {
              phoneNumber = customerParticipant.identity.replace('whatsapp:', '');
            } else if (customerParticipant.identity.startsWith('+')) {
              phoneNumber = customerParticipant.identity;
            }
          }
          
          console.log('🔍 Processing conversation:', conv.sid);
          console.log('📱 Participant data:', {
            identity: customerParticipant.identity,
            messagingBinding: customerParticipant.messagingBinding,
            attributes: customerParticipant.attributes
          });
          console.log('📞 Extracted data:', {
            phoneNumber,
            waId,
            phoneFromAddress: customerParticipant.messagingBinding?.address?.replace('whatsapp:', ''),
            phoneFromProxy: customerParticipant.messagingBinding?.proxy_address?.replace('whatsapp:', ''),
            phoneFromIdentity: customerParticipant.identity?.replace('whatsapp:', '')
          });
          
          if (phoneNumber || waId) {
            
            // Check if contact already exists by phone number
            let existingContact = null;
            if (phoneNumber) {
              existingContact = await db.findContactByPhone(phoneNumber);
            }
            
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
              
              // Create contact with customer's phone number
              console.log('🔍 Creating contact with data:', {
                phoneNumber,
                name: contactName,
                waId,
                profileName: profileName || contactName
              });
              
              const newContact = await autoCreateOrUpdateContact({
                phoneNumber: phoneNumber,
                name: contactName,
                waId: waId,
                profileName: profileName || contactName
              });
              
              console.log('🔍 Contact creation result:', newContact);
              
              if (newContact) {
                // Add WhatsApp ID to notes for future reference
                if (waId && newContact.id) {
                  await db.updateContact(newContact.id, {
                    notes: `WhatsApp ID: ${waId}`,
                    tags: ['whatsapp', 'auto-created']
                  });
                }
                
                results.contactsCreated++;
                console.log('✅ Created contact:', newContact.name, 'for phone:', phoneNumber, 'waId:', waId);
              } else {
                results.errors.push(`Failed to create contact for phone: ${phoneNumber}, waId: ${waId}`);
              }
            } else {
              // Update existing contact's last seen
              const updateData: any = {
                lastSeen: new Date().toISOString()
              };
              
              // Add WhatsApp ID to notes if not already there
              if (waId && (!existingContact.notes || !existingContact.notes.includes(waId))) {
                updateData.notes = existingContact.notes ? 
                  `${existingContact.notes}\nWhatsApp ID: ${waId}` : 
                  `WhatsApp ID: ${waId}`;
              }
              
              await db.updateContact(existingContact.id, updateData);
              results.contactsUpdated++;
              console.log('✅ Updated contact:', existingContact.name, 'for phone:', phoneNumber, 'waId:', waId);
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
