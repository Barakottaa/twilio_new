import { NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';
import { autoCreateOrUpdateContact } from '@/lib/contacts-service';
import { normalizePhoneNumber } from '@/lib/utils';

export async function POST() {
    try {
        const twilioClient = await getTwilioClient();

        // We fetch conversations and their participants to build a contact list
        const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });

        let syncedCount = 0;

        for (const conv of conversations) {
            try {
                const participants = await twilioClient.conversations.v1
                    .conversations(conv.sid)
                    .participants.list();

                for (const participant of participants) {
                    // Look for messaging binding address (phone number)
                    const address = participant.messagingBinding?.address;
                    const proxyAddress = participant.messagingBinding?.proxyAddress;

                    if (address && address.includes('whatsapp:')) {
                        const rawPhone = address.replace('whatsapp:', '');
                        const normalizedPhone = normalizePhoneNumber(rawPhone);

                        // Try to get name from attributes
                        let name = `WhatsApp ${normalizedPhone}`;
                        try {
                            if (participant.attributes) {
                                const attrs = JSON.parse(participant.attributes);
                                if (attrs.display_name) name = attrs.display_name;
                                else if (attrs.friendlyName) name = attrs.friendlyName;
                            }
                        } catch (e) { }

                        await autoCreateOrUpdateContact({
                            phoneNumber: normalizedPhone,
                            name: name
                        });
                        syncedCount++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing participants for conversation ${conv.sid}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${syncedCount} contacts from WhatsApp.`
        });
    } catch (error) {
        console.error('Error syncing contacts:', error);
        return NextResponse.json(
            { error: 'Failed to sync contacts' },
            { status: 500 }
        );
    }
}
