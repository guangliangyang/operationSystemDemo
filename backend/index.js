const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route modules
const processRoutes = require('./api/processRoutes');
const memoryRoutes = require('./api/memoryRoutes');
const fileSystemRoutes = require('./api/fileSystemRoutes');
const ioRoutes = require('./api/ioRoutes');
const synchronizationRoutes = require('./api/synchronizationRoutes');
const deadlockRoutes = require('./api/deadlockRoutes');
const multilevelRoutes = require('./api/multilevelRoutes');
const advancedMemoryRoutes = require('./api/advancedMemoryRoutes');
const realTimeRoutes = require('./api/realTimeRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Operating System Demo API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      processes: '/api/processes',
      memory: '/api/memory',
      filesystem: '/api/filesystem',
      io: '/api/io',
      synchronization: '/api/synchronization',
      deadlock: '/api/deadlock',
      multilevel: '/api/multilevel',
      advancedMemory: '/api/advanced-memory',
      realTime: '/api/realtime'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/processes', processRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/filesystem', fileSystemRoutes);
app.use('/api/io', ioRoutes);
app.use('/api/synchronization', synchronizationRoutes);
app.use('/api/deadlock', deadlockRoutes);
app.use('/api/multilevel', multilevelRoutes);
app.use('/api/advanced-memory', advancedMemoryRoutes);
app.use('/api/realtime', realTimeRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});