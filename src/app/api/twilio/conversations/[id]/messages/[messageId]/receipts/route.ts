import { NextRequest, NextResponse } from 'next/server';
import { DeliveryReceiptService } from '@/lib/delivery-receipt-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: conversationSid, messageId } = resolvedParams;

    if (!conversationSid || !messageId) {
      return NextResponse.json(
        { error: 'Conversation SID and Message SID are required' },
        { status: 400 }
      );
    }

    console.log('📬 Fetching delivery receipts for message:', { conversationSid, messageId });

    // Get all delivery receipts for the message
    const receipts = await DeliveryReceiptService.getMessageReceipts(conversationSid, messageId);
    
    // Get delivery statistics
    const stats = await DeliveryReceiptService.getMessageDeliveryStats(conversationSid, messageId);
    
    // Get latest status
    const latestStatus = await DeliveryReceiptService.getLatestMessageStatus(conversationSid, messageId);
    
    // Check if message has been read
    const isRead = await DeliveryReceiptService.isMessageRead(conversationSid, messageId);

    return NextResponse.json({
      success: true,
      data: {
        receipts,
        stats,
        latestStatus,
        isRead,
        messageId,
        conversationSid
      }
    });

  } catch (error) {
    console.error('Error fetching delivery receipts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch delivery receipts',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
