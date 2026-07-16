// ──────────────────────────────────────────────
// Industrias RUAM – Socket.io Handler
// ──────────────────────────────────────────────

let _io = null;

/**
 * Setup Socket.io event handlers.
 */
function setupSocket(io) {
  _io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Usuario conectado: ${socket.id}`);

    socket.on('join:role', (role) => {
      socket.join(role);
      console.log(`[Socket] ${socket.id} se unió al room: ${role}`);
    });

    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Usuario desconectado: ${socket.id}`);
    });
  });
}

/**
 * Get the Socket.io instance for emitting events from routes.
 */
function getIO() {
  if (!_io) {
    console.warn('[Socket] IO instance not initialized yet');
  }
  return _io;
}

/**
 * Emit event to all connected clients.
 */
function emitToAll(event, data) {
  if (_io) {
    _io.emit(event, data);
  }
}

/**
 * Emit event to a specific room (e.g., 'admin' or 'operario').
 */
function emitToRoom(room, event, data) {
  if (_io) {
    _io.to(room).emit(event, data);
  }
}

module.exports = {
  setupSocket,
  getIO,
  emitToAll,
  emitToRoom
};
