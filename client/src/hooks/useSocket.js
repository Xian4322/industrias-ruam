import { useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const on = (event, handler) => {
    const socket = socketRef.current || getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  };

  const off = (event, handler) => {
    const socket = socketRef.current || getSocket();
    socket.off(event, handler);
  };

  return { socket: socketRef.current, on, off, connected };
}
