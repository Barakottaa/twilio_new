// Enhanced delivery receipt service using Twilio's full Receipt API
import { getTwilioClient } from './twilio-service';

export interface DeliveryReceipt {
  sid: string;
  accountSid: string;
  conversationSid: string;
  messageSid: string;
  channelMessageSid: string;
  participantSid: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  errorCode?: number;
  dateCreated: string;
  dateUpdated: string;
  url: string;
}

export class DeliveryReceiptService {
  /**
   * Fetch delivery receipts for a specific message
   */
  static async getMessageReceipts(
    conversationSid: string, 
    messageSid: string
  ): Promise<DeliveryReceipt[]> {
    try {
      const client = await getTwilioClient();
      
      const receipts = await client.conversations.v1
        .conversations(conversationSid)
        .messages(messageSid)
        .deliveryReceipts.list({ limit: 50 });
      
      return receipts.map(receipt => ({
        sid: receipt.sid,
        accountSid: receipt.accountSid,
        conversationSid: receipt.conversationSid,
        messageSid: receipt.messageSid,
        channelMessageSid: receipt.channelMessageSid,
        participantSid: receipt.participantSid,
        status: receipt.status as any,
        errorCode: receipt.errorCode,
        dateCreated: receipt.dateCreated.toISOString(),
        dateUpdated: receipt.dateUpdated?.toISOString() || receipt.dateCreated.toISOString(),
        url: receipt.url
      }));
    } catch (error) {
      console.error('Error fetching delivery receipts:', error);
      return [];
    }
  }

  /**
   * Fetch a specific delivery receipt
   */
  static async getReceipt(
    conversationSid: string,
    messageSid: string,
    receiptSid: string
  ): Promise<DeliveryReceipt | null> {
    try {
      const client = await getTwilioClient();
      
      const receipt = await client.conversations.v1
        .conversations(conversationSid)
        .messages(messageSid)
        .deliveryReceipts(receiptSid)
        .fetch();
      
      return {
        sid: receipt.sid,
        accountSid: receipt.accountSid,
        conversationSid: receipt.conversationSid,
        messageSid: receipt.messageSid,
        channelMessageSid: receipt.channelMessageSid,
        participantSid: receipt.participantSid,
        status: receipt.status as any,
        errorCode: receipt.errorCode,
        dateCreated: receipt.dateCreated.toISOString(),
        dateUpdated: receipt.dateUpdated?.toISOString() || receipt.dateCreated.toISOString(),
        url: receipt.url
      };
    } catch (error) {
      console.error('Error fetching delivery receipt:', error);
      return null;
    }
  }

  /**
   * Get the latest delivery status for a message
   */
  static async getLatestMessageStatus(
    conversationSid: string,
    messageSid: string
  ): Promise<{ status: string; errorCode?: number; timestamp: string } | null> {
    try {
      const receipts = await this.getMessageReceipts(conversationSid, messageSid);
      
      if (receipts.length === 0) {
        return null;
      }

      // Sort by dateUpdated (most recent first)
      const latestReceipt = receipts.sort((a, b) => 
        new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime()
      )[0];

      return {
        status: latestReceipt.status,
        errorCode: latestReceipt.errorCode,
        timestamp: latestReceipt.dateUpdated
      };
    } catch (error) {
      console.error('Error getting latest message status:', error);
      return null;
    }
  }

  /**
   * Check if message has been read by any participant
   */
  static async isMessageRead(
    conversationSid: string,
    messageSid: string
  ): Promise<boolean> {
    try {
      const receipts = await this.getMessageReceipts(conversationSid, messageSid);
      return receipts.some(receipt => receipt.status === 'read');
    } catch (error) {
      console.error('Error checking if message is read:', error);
      return false;
    }
  }

  /**
   * Get delivery statistics for a message
   */
  static async getMessageDeliveryStats(
    conversationSid: string,
    messageSid: string
  ): Promise<{
    totalReceipts: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    undelivered: number;
  }> {
    try {
      const receipts = await this.getMessageReceipts(conversationSid, messageSid);
      
      const stats = {
        totalReceipts: receipts.length,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        undelivered: 0
      };

      receipts.forEach(receipt => {
        switch (receipt.status) {
          case 'sent': stats.sent++; break;
          case 'delivered': stats.delivered++; break;
          case 'read': stats.read++; break;
          case 'failed': stats.failed++; break;
          case 'undelivered': stats.undelivered++; break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        totalReceipts: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        undelivered: 0
      };
    }
  }
}
