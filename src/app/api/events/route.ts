// src/app/api/events/route.ts
import { NextRequest } from 'next/server';
import { addConnection, removeConnection, getConnectionCount } from '@/lib/sse-broadcast';

export async function GET(req: NextRequest) {
  console.log('🔌 New SSE connection request received');
  
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;
  
  // Limit connections to prevent memory issues
  const maxConnections = 10;
  if (getConnectionCount() >= maxConnections) {
    console.log(`⚠️ Connection limit reached (${maxConnections}), rejecting new connection`);
    return new Response("Connection limit reached", { status: 429 });
  }
  
  const stream = new ReadableStream({
    async start(ctrl) {
      controller = ctrl;
      console.log('🔌 SSE stream started, adding connection');
      
      // Add this connection to our set
      await addConnection(controller);
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      console.log('📡 Initial connection message sent');
    
      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          if (controller) {
            const heartbeatData = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() });
            controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
            console.log('💓 Heartbeat sent to connection');
          }
        } catch (error) {
          console.error('❌ Error sending heartbeat:', error);
          clearInterval(heartbeat);
          if (controller) removeConnection(controller);
        }
      }, 15000); // Send heartbeat every 15 seconds (more frequent)
      
      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        console.log('🔌 SSE connection aborted by client');
        clearInterval(heartbeat);
        if (controller) {
          removeConnection(controller);
          controller.close();
        }
      });
    },
    cancel() {
      console.log('🔌 SSE stream cancelled');
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


