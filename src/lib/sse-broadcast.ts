// src/lib/sse-broadcast.ts
// Server-Sent Events broadcast utility

// Store active connections with metadata
const connections = new Map<ReadableStreamDefaultController, { id: string, timestamp: number }>();

// Store recent messages for new connections (last 10 messages)
const recentMessages: Array<{ type: string, data: any, timestamp: number }> = [];

export function addConnection(controller: ReadableStreamDefaultController) {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  connections.set(controller, { id: connectionId, timestamp: Date.now() });
  console.log(`🔌 SSE connection added: ${connectionId}. Total connections: ${connections.size}`);
  
  // Send recent messages to new connection (within last 60 seconds)
  const encoder = new TextEncoder();
  const now = Date.now();
  const recentThreshold = 60000; // 60 seconds (increased from 5)
  
  console.log(`📨 Checking recent messages for new connection. Queue size: ${recentMessages.length}`);
  
  const messagesToSend = recentMessages.filter(msg => now - msg.timestamp < recentThreshold);
  console.log(`📨 Found ${messagesToSend.length} recent messages to send (threshold: ${recentThreshold}ms)`);
  
  messagesToSend.forEach(msg => {
    try {
      const message = JSON.stringify({ type: msg.type, data: msg.data });
      const eventData = `data: ${message}\n\n`;
      controller.enqueue(encoder.encode(eventData));
      console.log(`📨 Sent recent message to new connection: ${connectionId}`, msg.data);
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
export function broadcastMessage(type: string, data: any) {
  console.log(`📡 BROADCAST MESSAGE CALLED - Type: ${type}, Data:`, data);
  
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
  
  console.log(`📡 Broadcasting ${type} to ${connections.size} connections`);
  
  if (connections.size === 0) {
    console.log('⚠️ No active connections to broadcast to - message queued for next connection');
    return;
  }
  
  connections.forEach((connectionInfo, controller) => {
    try {
      controller.enqueue(encoder.encode(eventData));
      console.log(`✅ Message sent to connection: ${connectionInfo.id}`);
    } catch (error) {
      console.log(`❌ Error sending to connection ${connectionInfo.id}:`, error);
      // Remove dead connections
      connections.delete(controller);
      console.log(`🧹 Removed dead connection: ${connectionInfo.id}. Remaining: ${connections.size}`);
    }
  });
}

// Clean up stale connections (older than 5 minutes)
function cleanupStaleConnections() {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [controller, connectionInfo] of connections.entries()) {
    if (now - connectionInfo.timestamp > staleThreshold) {
      console.log(`🧹 Cleaning up stale connection: ${connectionInfo.id}`);
      connections.delete(controller);
    }
  }
}

export function getConnectionCount() {
  return connections.size;
}
