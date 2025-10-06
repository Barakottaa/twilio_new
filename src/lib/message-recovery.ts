// src/lib/message-recovery.ts
// Enhanced message recovery system for development mode

import { sqliteDb } from './sqlite-database';

interface RecoveryMessage {
  conversationSid: string;
  messageSid: string;
  body: string;
  author: string;
  dateCreated: string;
  index: string;
}

class MessageRecoveryService {
  private recoveryQueue: RecoveryMessage[] = [];
  private isRecovering = false;

  /**
   * Add message to recovery queue when SSE is down
   */
  addToRecoveryQueue(message: RecoveryMessage) {
    console.log('🔄 Adding message to recovery queue:', message.messageSid);
    this.recoveryQueue.push(message);
  }

  /**
   * Process recovery queue when SSE comes back online
   */
  async processRecoveryQueue() {
    if (this.isRecovering || this.recoveryQueue.length === 0) {
      return;
    }

    this.isRecovering = true;
    console.log(`🔄 Processing ${this.recoveryQueue.length} messages from recovery queue`);

    try {
      // Process messages in chronological order
      const sortedMessages = this.recoveryQueue.sort((a, b) => 
        new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
      );

      for (const message of sortedMessages) {
        await this.recoverMessage(message);
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ Recovery queue processed successfully');
      this.recoveryQueue = [];
    } catch (error) {
      console.error('❌ Error processing recovery queue:', error);
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Recover a single message
   */
  private async recoverMessage(message: RecoveryMessage) {
    try {
      // Check if message already exists in database
      const existingMessage = await sqliteDb.getMessageByTwilioSid(message.messageSid);
      if (existingMessage) {
        console.log('ℹ️ Message already exists, skipping:', message.messageSid);
        return;
      }

      // Store message in database
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await sqliteDb.createMessage({
        id: messageId,
        conversation_id: message.conversationSid,
        sender_id: message.author,
        sender_type: 'contact', // Assuming contact messages for recovery
        content: message.body,
        message_type: 'text',
        twilio_message_sid: message.messageSid
      });

      console.log('✅ Recovered message:', message.messageSid);
    } catch (error) {
      console.error('❌ Error recovering message:', error);
    }
  }

  /**
   * Get recovery queue status
   */
  getRecoveryStatus() {
    return {
      queueLength: this.recoveryQueue.length,
      isRecovering: this.isRecovering,
      messages: this.recoveryQueue.map(m => ({
        messageSid: m.messageSid,
        body: m.body,
        dateCreated: m.dateCreated
      }))
    };
  }

  /**
   * Clear recovery queue
   */
  clearRecoveryQueue() {
    console.log('🧹 Clearing recovery queue');
    this.recoveryQueue = [];
  }
}

export const messageRecoveryService = new MessageRecoveryService();
