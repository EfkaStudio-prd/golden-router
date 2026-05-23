require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import API routes
const combosRouter = require('./src/api/combos');
const accountsRouter = require('./src/api/accounts');
const quotaRouter = require('./src/api/quota');
const logsRouter = require('./src/api/logs');

const app = express();
const PORT = process.env.PORT || 20129;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '2.0.0',
    name: 'Golden Router v2.0 Hybrid'
  });
});

// API Routes
app.use('/api/combos', combosRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/quota', quotaRouter);
app.use('/api/logs', logsRouter);

// Placeholder for v1 compatibility API (to be integrated with OmniRoute)
app.use('/v1', (req, res) => {
  res.json({ 
    message: 'OpenAI-compatible API endpoint - to be integrated with OmniRoute',
    note: 'This is a placeholder. Full OmniRoute integration coming in Sprint 2-4'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message 
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    🥇 GOLDEN ROUTER v2.0                        ║
║                   Hybrid (OmniRoute + 9Router)                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Server running at: http://${HOST}:${PORT}                   ║
║                                                                 ║
║  Available Endpoints:                                          ║
║  - GET  /health                                                ║
║  - GET  /api/combos                                            ║
║  - POST /api/combos                                            ║
║  - GET  /api/accounts                                          ║
║  - POST /api/accounts                                          ║
║  - GET  /api/quota                                             ║
║  - GET  /api/logs                                              ║
║  - GET  /api/logs/export                                       ║
║                                                                 ║
║  Data Directory: ${process.env.DATA_DIR || '~/.golden-router'} ║
║                                                                 ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
