import { NextRequest, NextResponse } from 'next/server';
import { createContact } from '@/lib/contacts-service';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, name, message } = await req.json();
    
    if (!phoneNumber || !name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, name, message' },
        { status: 400 }
      );
    }

    console.log('🧪 Creating test contact:', { phoneNumber, name, message });

    // Create contact directly in database (simpler approach)
    const contact = await createContact({
      name: name,
      phoneNumber: phoneNumber,
      notes: `Test contact created via test endpoint. Message: ${message}`
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to create contact in database' },
        { status: 500 }
      );
    }

    console.log('✅ Created test contact:', contact.id);

    return NextResponse.json({
      success: true,
      contact: contact,
      message: `Test contact created: ${name} (${phoneNumber})`
    });

  } catch (error) {
    console.error('❌ Error creating test contact:', error);
    return NextResponse.json(
      { error: 'Failed to create test contact', details: String(error) },
      { status: 500 }
    );
  }
}
