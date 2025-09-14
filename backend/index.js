const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

// API routes placeholder
app.get('/api/processes', (req, res) => {
  res.json({ message: 'Process scheduling endpoints coming soon' });
});

app.get('/api/memory', (req, res) => {
  res.json({ message: 'Memory management endpoints coming soon' });
});

app.get('/api/filesystem', (req, res) => {
  res.json({ message: 'File system endpoints coming soon' });
});

app.get('/api/io', (req, res) => {
  res.json({ message: 'I/O management endpoints coming soon' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});