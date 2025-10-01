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
          // Extract phone number from multiple sources
          let phoneNumber = '';
          let waId = '';
          
          // Try messagingBinding.address first
          if (customerParticipant.messagingBinding?.address) {
            phoneNumber = customerParticipant.messagingBinding.address.replace('whatsapp:', '');
          }
          
          // Try messagingBinding.proxy_address
          if (!phoneNumber && customerParticipant.messagingBinding?.proxy_address) {
            phoneNumber = customerParticipant.messagingBinding.proxy_address.replace('whatsapp:', '');
          }
          
          // Try identity
          if (!phoneNumber && customerParticipant.identity) {
            if (customerParticipant.identity.startsWith('whatsapp:')) {
              phoneNumber = customerParticipant.identity.replace('whatsapp:', '');
            } else if (customerParticipant.identity.startsWith('+')) {
              phoneNumber = customerParticipant.identity;
            }
          }
          
          // Extract WhatsApp ID (without country code)
          if (customerParticipant.messagingBinding?.proxy_address) {
            waId = customerParticipant.messagingBinding.proxy_address.replace('whatsapp:', '');
          } else if (customerParticipant.identity) {
            const identityPhone = customerParticipant.identity.replace('whatsapp:', '').replace('+', '');
            waId = identityPhone;
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
            
            // Check if contact already exists by phone number or WhatsApp ID
            let existingContact = null;
            if (phoneNumber) {
              existingContact = await db.findContactByPhone(phoneNumber);
            }
            
            // If not found by phone, try to find by WhatsApp ID in notes or tags
            if (!existingContact && waId) {
              const allContacts = await db.getAllContacts();
              existingContact = allContacts.find(contact => 
                contact.notes?.includes(waId) || 
                contact.tags?.includes(waId) ||
                contact.phoneNumber?.includes(waId)
              );
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
              
              // Use phone number if available, otherwise use WhatsApp ID
              const contactPhone = phoneNumber || (waId ? `+${waId}` : '');
              
              // Create contact with WhatsApp ID in notes for tracking
              const newContact = await autoCreateOrUpdateContact({
                phoneNumber: contactPhone,
                name: contactName,
                waId: waId || contactPhone.replace('+', ''),
                profileName: profileName || contactName
              });
              
              if (newContact) {
                // Add WhatsApp ID to notes for future reference
                if (waId && newContact.id) {
                  await db.updateContact(newContact.id, {
                    notes: `WhatsApp ID: ${waId}`,
                    tags: ['whatsapp', 'auto-created']
                  });
                }
                
                results.contactsCreated++;
                console.log('✅ Created contact:', newContact.name, 'for phone:', contactPhone, 'waId:', waId);
              } else {
                results.errors.push(`Failed to create contact for phone: ${contactPhone}, waId: ${waId}`);
              }
            } else {
              // Update existing contact's last seen and phone number if missing
              const updateData: any = {
                lastSeen: new Date().toISOString()
              };
              
              // Update phone number if it was missing
              if (!existingContact.phoneNumber && phoneNumber) {
                updateData.phoneNumber = phoneNumber;
              }
              
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
