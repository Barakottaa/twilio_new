// Storage optimization strategies for free cloud hosting

export interface StorageOptimizationConfig {
  // Message retention policies
  maxMessagesPerConversation: number;
  maxConversationAge: number; // days
  archiveOldMessages: boolean;
  
  // Data compression
  compressOldMessages: boolean;
  removeDuplicateData: boolean;
  
  // Cleanup policies
  autoCleanup: boolean;
  cleanupInterval: number; // hours
}

export const DEFAULT_OPTIMIZATION_CONFIG: StorageOptimizationConfig = {
  maxMessagesPerConversation: 1000, // Keep last 1000 messages per conversation
  maxConversationAge: 90, // Archive conversations older than 90 days
  archiveOldMessages: true,
  compressOldMessages: true,
  removeDuplicateData: true,
  autoCleanup: true,
  cleanupInterval: 24 // Run cleanup every 24 hours
};

// Message compression utility
export function compressMessage(message: any): string {
  // Remove unnecessary fields and compress data
  const compressed = {
    id: message.id,
    text: message.text,
    ts: message.timestamp,
    s: message.sender === 'agent' ? 'a' : 'c', // 'a' for agent, 'c' for customer
    si: message.senderId
  };
  
  return JSON.stringify(compressed);
}

// Decompress message
export function decompressMessage(compressed: string): any {
  const data = JSON.parse(compressed);
  return {
    id: data.id,
    text: data.text,
    timestamp: data.ts,
    sender: data.s === 'a' ? 'agent' : 'customer',
    senderId: data.si
  };
}

// Calculate storage usage
export function calculateStorageUsage(messages: any[]): {
  totalMessages: number;
  estimatedSize: number;
  compressedSize: number;
  savings: number;
} {
  const totalMessages = messages.length;
  
  // Estimate current size (rough calculation)
  const estimatedSize = messages.reduce((total, msg) => {
    return total + (msg.text?.length || 0) + 100; // 100 bytes for metadata
  }, 0);
  
  // Calculate compressed size
  const compressedSize = messages.reduce((total, msg) => {
    const compressed = compressMessage(msg);
    return total + compressed.length;
  }, 0);
  
  const savings = estimatedSize - compressedSize;
  
  return {
    totalMessages,
    estimatedSize,
    compressedSize,
    savings
  };
}

// Storage cleanup recommendations
export function getStorageRecommendations(currentUsage: number, freeLimit: number): string[] {
  const recommendations: string[] = [];
  const usagePercent = (currentUsage / freeLimit) * 100;
  
  if (usagePercent > 80) {
    recommendations.push('🚨 High storage usage! Consider implementing message archiving.');
  }
  
  if (usagePercent > 60) {
    recommendations.push('⚠️ Consider reducing message retention period.');
    recommendations.push('💡 Enable message compression to save space.');
  }
  
  if (usagePercent > 40) {
    recommendations.push('📊 Monitor storage usage regularly.');
    recommendations.push('🗑️ Set up automatic cleanup of old messages.');
  }
  
  if (usagePercent < 20) {
    recommendations.push('✅ Storage usage is healthy!');
  }
  
  return recommendations;
}
