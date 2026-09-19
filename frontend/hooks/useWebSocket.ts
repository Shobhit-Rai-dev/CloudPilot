'use client';

import { useEffect, useRef } from 'react';

export function useWebSocket(onEvent?: (event: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let wsUrl = 'ws://127.0.0.1:8000/api/ws';
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In local dev Next.js rewrite or direct backend port
      wsUrl = `${proto}//${window.location.hostname}:8000/api/ws`;
    }

    let isMounted = true;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          // Connected
        };

        socket.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (onEvent) onEvent(data);
          } catch {
            // ignore heartbeat
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch {
        // Fallback retry
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onEvent]);

  return wsRef;
}
