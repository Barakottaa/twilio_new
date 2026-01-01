import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function DELETE() {
    try {
        const db = await getDatabase();
        // We'll mark all contacts as inactive instead of hard deleting
        // or we can perform a cleanup if the user really wants to "clear"

        // For "Clear All", we'll do a soft delete for safety
        const contacts = await db.getAllContacts();
        for (const contact of contacts) {
            await db.deleteContact(contact.id);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully cleared ${contacts.length} contacts.`
        });
    } catch (error) {
        console.error('Error clearing contacts:', error);
        return NextResponse.json(
            { error: 'Failed to clear contacts' },
            { status: 500 }
        );
    }
}
