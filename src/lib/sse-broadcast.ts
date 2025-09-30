// src/lib/sse-broadcast.ts
// Server-Sent Events broadcast utility

// Store active connections with metadata
const connections = new Map<ReadableStreamDefaultController, { id: string, timestamp: number }>();

export function addConnection(controller: ReadableStreamDefaultController) {
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  connections.set(controller, { id: connectionId, timestamp: Date.now() });
  console.log(`🔌 SSE connection added: ${connectionId}. Total connections: ${connections.size}`);
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
  const message = JSON.stringify({ type, data });
  const eventData = `data: ${message}\n\n`;
  
  // Clean up stale connections first
  cleanupStaleConnections();
  
  console.log(`📡 Broadcasting ${type} to ${connections.size} connections:`, data);
  
  if (connections.size === 0) {
    console.log('⚠️ No active connections to broadcast to');
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
