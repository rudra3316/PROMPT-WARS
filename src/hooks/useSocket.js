import { useState, useEffect, useRef } from 'react';

/**
 * useSocket — connects to the Node.js backend via WebSocket (Socket.io)
 * Falls back gracefully if the server isn't running.
 */
export const useSocket = (url) => {
  const [connected, setConnected] = useState(false);
  const [lastData, setLastData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Dynamically load socket.io-client only if server URL is configured
    const loadSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const socket = io(url, {
          reconnectionAttempts: 3,
          timeout: 3000,
          transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('[Socket] Connected to CrowdSense server');
          setConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('[Socket] Disconnected');
          setConnected(false);
        });

        socket.on('crowd:update', (data) => {
          setLastData(data);
        });

        socket.on('connect_error', (err) => {
          console.warn('[Socket] Connection failed, using local simulation:', err.message);
        });

      } catch (err) {
        console.warn('[Socket] socket.io-client not available:', err.message);
      }
    };

    loadSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url]);

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  return { connected, lastData, emit };
};
