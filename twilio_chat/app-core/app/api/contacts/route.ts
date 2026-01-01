import { NextRequest, NextResponse } from 'next/server';
import { getAllContacts, createContact } from '@/lib/contacts-service';

export async function GET() {
  try {
    const contacts = await getAllContacts();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Normalize phone number to prevent duplicates
    if (data.phoneNumber) {
      const { normalizePhoneNumber } = await import('@/lib/utils');
      data.phoneNumber = normalizePhoneNumber(data.phoneNumber);
    }
    
    const contact = await createContact(data);

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      );
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
