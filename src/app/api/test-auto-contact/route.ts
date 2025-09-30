import { NextRequest, NextResponse } from 'next/server';
import { autoCreateOrUpdateContact } from '@/lib/contacts-service';

// Test endpoint to verify automatic contact creation
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, name, waId, profileName } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing auto contact creation:', { phoneNumber, name, waId, profileName });

    const contact = await autoCreateOrUpdateContact({
      phoneNumber,
      name,
      waId,
      profileName
    });

    if (contact) {
      return NextResponse.json({
        success: true,
        message: 'Contact created/updated successfully',
        contact: {
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          avatar: contact.avatar,
          lastSeen: contact.lastSeen
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create/update contact' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test auto contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test endpoint to get all contacts
export async function GET() {
  try {
    const { getAllContacts } = await import('@/lib/contacts-service');
    const contacts = await getAllContacts();
    
    return NextResponse.json({
      success: true,
      contacts: contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        avatar: contact.avatar,
        lastSeen: contact.lastSeen
      }))
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
