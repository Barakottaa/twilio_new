// src/app/api/events/route.ts
import { NextRequest } from 'next/server';
import { addConnection, removeConnection } from '@/lib/sse-broadcast';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;
  
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      // Add this connection to our set
      addConnection(controller);
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      
      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() });
          controller?.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
          if (controller) removeConnection(controller);
        }
      }, 30000); // Send heartbeat every 30 seconds
      
      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        if (controller) {
          removeConnection(controller);
          controller.close();
        }
      });
    },
    cancel() {
      if (controller) removeConnection(controller);
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


