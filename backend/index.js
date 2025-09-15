const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route modules
const processRoutes = require('./api/processRoutes');
const memoryRoutes = require('./api/memoryRoutes');
const fileSystemRoutes = require('./api/fileSystemRoutes');
const ioRoutes = require('./api/ioRoutes');

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
      io: '/api/io'
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});