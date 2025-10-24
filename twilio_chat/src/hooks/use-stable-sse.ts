// src/hooks/use-stable-sse.ts
// Enhanced SSE hook for development mode stability

import { useEffect, useRef, useState } from 'react';

interface StableSSEOptions {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  enableRecovery?: boolean;
}

export function useStableSSE(options: StableSSEOptions = {}) {
  const {
    reconnectDelay = 2000,
    maxReconnectAttempts = 10,
    enableRecovery = true
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastMessage, setLastMessage] = useState<any>(null);

  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    console.log(`🔄 Attempting SSE connection (attempt ${reconnectAttemptsRef.current + 1})`);

    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ SSE connected successfully');
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
      
      // Process recovery queue if enabled
      if (enableRecovery) {
        import('@/lib/message-recovery').then(({ messageRecoveryService }) => {
          messageRecoveryService.processRecoveryQueue();
        });
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        
        if (data.type === 'connected') {
          console.log('📡 SSE connected:', data.message);
        } else if (data.type === 'heartbeat') {
          // Only log every 10th heartbeat to reduce noise
          if (Math.random() < 0.1) {
            console.log('💓 SSE heartbeat received');
          }
        } else if (data.type === 'newMessage') {
          console.log('📨 New message via SSE:', data.data);
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      setConnectionStatus('error');
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Only reconnect if we haven't exceeded max attempts
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1); // Exponential backoff
        
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached');
        setConnectionStatus('disconnected');
      }
    };

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectSSE();
    
    // Health check interval
    const healthCheckInterval = setInterval(() => {
      if (eventSourceRef.current) {
        if (eventSourceRef.current.readyState === EventSource.CLOSED) {
          console.log('🔍 SSE connection is closed, attempting to reconnect...');
          setConnectionStatus('disconnected');
          connectSSE();
        } else if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
          setConnectionStatus('connecting');
        } else if (eventSourceRef.current.readyState === EventSource.OPEN) {
          setConnectionStatus('connected');
        }
      }
    }, 5000); // Check every 5 seconds

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(healthCheckInterval);
      eventSource.close();
    };
  }, []);

  return {
    connectionStatus,
    lastMessage,
    reconnect: connectSSE,
    isConnected: connectionStatus === 'connected'
  };
}
