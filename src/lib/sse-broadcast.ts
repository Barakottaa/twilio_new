// src/lib/sse-broadcast.ts
// Server-Sent Events broadcast utility

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
}

export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
}

// Function to broadcast messages to all connected clients
export function broadcastMessage(type: string, data: any) {
  const encoder = new TextEncoder();
  const message = JSON.stringify({ type, data });
  const eventData = `data: ${message}\n\n`;
  
  connections.forEach(controller => {
    try {
      controller.enqueue(encoder.encode(eventData));
    } catch (error) {
      // Remove dead connections
      connections.delete(controller);
    }
  });
}

export function getConnectionCount() {
  return connections.size;
}
