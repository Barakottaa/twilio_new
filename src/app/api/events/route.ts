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
      
      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() });
          controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
          connections.delete(controller);
        }
      }, 30000); // Send heartbeat every 30 seconds
      
      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
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

