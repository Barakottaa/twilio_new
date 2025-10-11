// src/app/api/events/route.ts
import { NextRequest } from 'next/server';
import { addConnection, removeConnection, getConnectionCount } from '@/lib/sse-broadcast';

// Force Node.js runtime for SSE support (edge runtime buffers streams)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('🔌 New SSE connection request received');
  
  // Allow more connections in development to tolerate hot reloads
  const maxConnections = process.env.NODE_ENV === 'development' ? 100 : 10;
  if (getConnectionCount() >= maxConnections) {
    console.log(`⚠️ Connection limit reached (${maxConnections}), rejecting new connection`);
    return new Response("Connection limit reached", { status: 429 });
  }
  
  // Create a new readable stream for this client
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      // Send first comment to flush headers immediately
      controller.enqueue(encoder.encode(':ok\n\n'));
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      // Register this connection globally
      await addConnection(controller);

      // Heartbeat every 10 seconds
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() });
          controller.enqueue(encoder.encode(`data: ${heartbeatData}\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
          removeConnection(controller);
        }
      }, 10000);

      // Handle close events
      const closeConnection = () => {
        clearInterval(heartbeat);
        removeConnection(controller);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      };

      // When client disconnects
      req.signal.addEventListener('abort', closeConnection);

      // Store close handler on controller for cleanup
      (controller as any).onclose = closeConnection;
    },
    
    cancel() {
      // Cleanup is handled in the closeConnection function
    }
  });

  // Return the SSE stream
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}


