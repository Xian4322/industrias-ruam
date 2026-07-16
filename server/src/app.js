require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Initialize database
const db = require('./config/database');

// Run seed data
const runSeed = require('./seed');
runSeed(db);

// Import socket handler
const { setupSocket } = require('./socket/handler');

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const kanbanRoutes = require('./routes/kanban');
const qualityRoutes = require('./routes/quality');
const evmRoutes = require('./routes/evm');
const changesRoutes = require('./routes/changes');
const dashboardRoutes = require('./routes/dashboard');

// Import auth middleware
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Setup CORS – allow env-configured origins for production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Industrias RUAM API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Reseed endpoint (forces demo data reload) ──
app.get('/api/v1/reseed', (req, res) => {
  try {
    db.pragma('foreign_keys = OFF');
    const tables = ['evm_records','change_requests','packaging_qc','quality_checks',
                     'maintenance_logs','kanban_history','order_materials','orders',
                     'baseline_config','users'];
    tables.forEach(t => db.prepare(`DELETE FROM ${t}`).run());
    db.pragma('foreign_keys = ON');
    console.log('[Reseed] Tablas limpiadas, insertando datos demo...');
    runSeed(db);
    const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    res.json({
      success: true,
      message: 'Datos demo re-insertados correctamente',
      users: userCount,
      orders: orderCount
    });
  } catch (err) {
    db.pragma('foreign_keys = ON');
    res.status(500).json({ error: err.message });
  }
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', authMiddleware, orderRoutes);
app.use('/api/v1/kanban', authMiddleware, kanbanRoutes);
app.use('/api/v1/quality', authMiddleware, qualityRoutes);
app.use('/api/v1/evm', authMiddleware, evmRoutes);
app.use('/api/v1/changes', authMiddleware, changesRoutes);
app.use('/api/v1', dashboardRoutes); // Public - no auth for Power BI

// Also mount maintenance route if it exists
try {
  const maintenanceRoutes = require('./routes/maintenance');
  app.use('/api/v1/maintenance', authMiddleware, maintenanceRoutes);
} catch (e) {
  // maintenance route is optional
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupSocket(io);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  🏭 Industrias RUAM - API Server');
  console.log('========================================');
  console.log(`  📡 Puerto: ${PORT}`);
  console.log(`  🌐 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`  🔌 Socket.io: habilitado`);
  console.log(`  📊 Dashboard: http://localhost:${PORT}/api/v1/dashboard-metrics`);
  console.log(`  ❤️  Health: http://localhost:${PORT}/api/v1/health`);
  console.log('========================================\n');
});

module.exports = { app, server, io };
