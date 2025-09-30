// Message archiving system for storage optimization

export interface ArchivedMessage {
  id: string;
  conversationId: string;
  content: string;
  senderType: 'agent' | 'customer';
  senderId: string;
  timestamp: string;
  archivedAt: string;
}

export interface ArchiveConfig {
  maxMessagesPerConversation: number;
  archiveAfterDays: number;
  compressArchivedMessages: boolean;
}

export const DEFAULT_ARCHIVE_CONFIG: ArchiveConfig = {
  maxMessagesPerConversation: 1000, // Keep last 1000 messages active
  archiveAfterDays: 30, // Archive messages older than 30 days
  compressArchivedMessages: true
};

// Archive old messages to reduce active storage
export async function archiveOldMessages(
  conversationId: string,
  config: ArchiveConfig = DEFAULT_ARCHIVE_CONFIG
): Promise<{ archived: number; remaining: number }> {
  try {
    // This would integrate with your database service
    // For now, this is a template showing the logic
    
    console.log(`🗄️ Archiving old messages for conversation: ${conversationId}`);
    
    // Get all messages for the conversation
    // const messages = await getMessagesForConversation(conversationId);
    
    // Sort by timestamp (newest first)
    // const sortedMessages = messages.sort((a, b) => 
    //   new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    // );
    
    // Keep the most recent messages active
    // const activeMessages = sortedMessages.slice(0, config.maxMessagesPerConversation);
    // const messagesToArchive = sortedMessages.slice(config.maxMessagesPerConversation);
    
    // Archive old messages
    // const archivedCount = await archiveMessages(messagesToArchive);
    
    // Update conversation with only active messages
    // await updateConversationMessages(conversationId, activeMessages);
    
    console.log(`✅ Archived messages, keeping ${config.maxMessagesPerConversation} active`);
    
    return {
      archived: 0, // archivedCount,
      remaining: config.maxMessagesPerConversation
    };
  } catch (error) {
    console.error('❌ Error archiving messages:', error);
    throw error;
  }
}

// Get archived messages when needed
export async function getArchivedMessages(
  conversationId: string,
  limit: number = 100
): Promise<ArchivedMessage[]> {
  try {
    // This would fetch from your archive storage
    // Could be a separate table, file storage, or external service
    console.log(`📂 Retrieving archived messages for conversation: ${conversationId}`);
    
    // Return empty array for now - implement based on your archive storage
    return [];
  } catch (error) {
    console.error('❌ Error retrieving archived messages:', error);
    return [];
  }
}

// Calculate storage savings from archiving
export function calculateArchiveSavings(
  totalMessages: number,
  activeMessages: number
): {
  messagesArchived: number;
  estimatedSavings: number; // in bytes
  savingsPercent: number;
} {
  const messagesArchived = totalMessages - activeMessages;
  const estimatedSavings = messagesArchived * 200; // ~200 bytes per message
  const savingsPercent = (messagesArchived / totalMessages) * 100;
  
  return {
    messagesArchived,
    estimatedSavings,
    savingsPercent
  };
}

// Storage monitoring
export function getStorageStatus(
  currentUsage: number,
  freeLimit: number,
  totalMessages: number
): {
  usagePercent: number;
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
} {
  const usagePercent = (currentUsage / freeLimit) * 100;
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  const recommendations: string[] = [];
  
  if (usagePercent > 80) {
    status = 'critical';
    recommendations.push('🚨 Critical: Implement message archiving immediately');
    recommendations.push('💾 Consider upgrading to paid plan');
  } else if (usagePercent > 60) {
    status = 'warning';
    recommendations.push('⚠️ Warning: Storage usage is high');
    recommendations.push('🗄️ Archive messages older than 30 days');
    recommendations.push('📊 Enable message compression');
  } else {
    recommendations.push('✅ Storage usage is healthy');
  }
  
  // Add message-based recommendations
  if (totalMessages > 100000) {
    recommendations.push('📈 High message volume - consider archiving strategy');
  }
  
  return {
    usagePercent,
    status,
    recommendations
  };
}
