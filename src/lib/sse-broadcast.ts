// src/lib/sse-broadcast.ts
// Server-Sent Events broadcast utility

// Persist across Next.js (and Vite) dev hot-reloads by stashing on globalThis
const g = globalThis as unknown as {
  __SSE_CONNECTIONS__?: Map<ReadableStreamDefaultController, { id: string; timestamp: number }>
  __SSE_RECENT_MESSAGES__?: Array<{ type: string; data: any; timestamp: number }>
};

export const connections = g.__SSE_CONNECTIONS__ ||= new Map();
export const recentMessages = g.__SSE_RECENT_MESSAGES__ ||= [];

export async function addConnection(controller: ReadableStreamDefaultController) {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  connections.set(controller, { id: connectionId, timestamp: Date.now() });
  console.log(`🔌 SSE connection added: ${connectionId}. Total connections: ${connections.size}`);
  
  // Process recovery queue when connection is established
  try {
    const { messageRecoveryService } = await import('./message-recovery');
    await messageRecoveryService.processRecoveryQueue();
  } catch (error) {
    console.error('❌ Failed to process recovery queue:', error);
  }
  
  // Send recent messages to new connection (within last 60 seconds)
  const encoder = new TextEncoder();
  const now = Date.now();
  const recentThreshold = 60000; // 60 seconds (increased from 5)
  
  const messagesToSend = recentMessages.filter(msg => now - msg.timestamp < recentThreshold);
  
  messagesToSend.forEach(msg => {
    try {
      const message = JSON.stringify({ type: msg.type, data: msg.data });
      const eventData = `data: ${message}\n\n`;
      controller.enqueue(encoder.encode(eventData));
    } catch (error) {
      console.error(`❌ Error sending recent message to ${connectionId}:`, error);
    }
  });
}

export function removeConnection(controller: ReadableStreamDefaultController) {
  const connectionInfo = connections.get(controller);
  const connectionId = connectionInfo?.id || 'unknown';
  connections.delete(controller);
  console.log(`🔌 SSE connection removed: ${connectionId}. Total connections: ${connections.size}`);
}

// Function to broadcast messages to all connected clients
export async function broadcastMessage(type: string, data: any) {
  
  const encoder = new TextEncoder();
  
  // Serialize data to JSON with error handling
  let message: string;
  try {
    // Create a serializable copy of the data
    const serializableData = JSON.parse(JSON.stringify(data));
    message = JSON.stringify({ type, data: serializableData });
  } catch (serializationError) {
    console.error('❌ Error serializing message data:', serializationError);
    // Fallback to a simplified version
    message = JSON.stringify({ 
      type, 
      data: { 
        error: 'Failed to serialize full message',
        conversationSid: data?.conversationSid,
        messageSid: data?.messageSid 
      } 
    });
  }
  
  const eventData = `data: ${message}\n\n`;
  
  // Store message in recent messages queue (with serializable data only)
  try {
    const serializableData = JSON.parse(JSON.stringify(data));
    recentMessages.push({ type, data: serializableData, timestamp: Date.now() });
  } catch (error) {
    console.error('❌ Error storing message in queue:', error);
  }
  
  // Keep only last 10 messages
  if (recentMessages.length > 10) {
    recentMessages.shift();
  }
  
  // Clean up stale connections first
  cleanupStaleConnections();
  
  if (connections.size === 0) {
    
    // Add to recovery queue if it's a newMessage
    if (type === 'newMessage') {
      try {
        const { messageRecoveryService } = await import('./message-recovery');
        messageRecoveryService.addToRecoveryQueue({
          conversationSid: data.conversationSid,
          messageSid: data.messageSid,
          body: data.body,
          author: data.author,
          dateCreated: data.dateCreated,
          index: data.index
        });
      } catch (error) {
        console.error('❌ Failed to add message to recovery queue:', error);
      }
    }
    return;
  }
  
  connections.forEach((connectionInfo, controller) => {
    try {
      controller.enqueue(encoder.encode(eventData));
    } catch (error) {
      // Remove dead connections
      try {
        connections.delete(controller);
      } catch (deleteError) {
        console.error(`❌ Error removing dead connection ${connectionInfo.id}:`, deleteError);
      }
    }
  });
}

// Clean up stale connections (older than 5 minutes)
function cleanupStaleConnections() {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [controller, connectionInfo] of connections.entries()) {
    if (now - connectionInfo.timestamp > staleThreshold) {
      connections.delete(controller);
    }
  }
}

export function getConnectionCount() {
  return connections.size;
}
