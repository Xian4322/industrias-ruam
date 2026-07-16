import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  socket.on('connect', () => console.log('[Socket] Conectado:', socket.id));
  socket.on('disconnect', () => console.log('[Socket] Desconectado'));
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  if (!socket) return connectSocket();
  return socket;
}
