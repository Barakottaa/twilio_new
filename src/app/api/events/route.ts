// src/app/api/events/route.ts
import { NextRequest } from 'next/server';

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller);
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      
      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        connections.delete(controller);
        controller.close();
      });
    },
    cancel() {
      connections.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
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

