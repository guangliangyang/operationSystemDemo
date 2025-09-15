const express = require('express');
const { IOManager } = require('../algorithms/ioManagement');

const router = express.Router();

// Create I/O manager instance
let ioManager = new IOManager();

// Initialize I/O system
router.post('/initialize', (req, res) => {
  try {
    const { devices = [], buffers = [] } = req.body;

    ioManager.reset();

    // Add devices
    devices.forEach(device => {
      const { deviceId, name, serviceTime = 5 } = device;
      if (!deviceId || !name) {
        throw new Error('Device ID and name are required');
      }
      ioManager.addDevice(deviceId, name, serviceTime);
    });

    // Add buffers
    buffers.forEach(buffer => {
      const { bufferId, size = 5 } = buffer;
      if (!bufferId) {
        throw new Error('Buffer ID is required');
      }
      ioManager.addBuffer(bufferId, size);
    });

    res.json({
      message: 'I/O system initialized',
      configuration: {
        devices: devices.length,
        buffers: buffers.length
      },
      state: ioManager.getSystemState()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get I/O scheduling algorithms
router.get('/algorithms', (req, res) => {
  res.json({
    algorithms: [
      {
        id: 'fcfs',
        name: 'First Come First Serve',
        description: 'I/O requests are processed in order of arrival'
      },
      {
        id: 'sjf',
        name: 'Shortest Job First',
        description: 'Shorter I/O operations are prioritized'
      },
      {
        id: 'buffering',
        name: 'Buffering Simulation',
        description: 'Demonstrates producer-consumer buffering strategies'
      }
    ]
  });
});

// Add I/O requests
router.post('/requests', (req, res) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests array is required' });
    }

    ioManager.reset();

    // Re-add devices if they exist
    const defaultDevices = [
      { deviceId: 'disk1', name: 'Primary Disk', serviceTime: 5 },
      { deviceId: 'disk2', name: 'Secondary Disk', serviceTime: 7 },
      { deviceId: 'printer', name: 'Network Printer', serviceTime: 3 },
      { deviceId: 'scanner', name: 'Document Scanner', serviceTime: 4 }
    ];

    defaultDevices.forEach(device => {
      ioManager.addDevice(device.deviceId, device.name, device.serviceTime);
    });

    // Add requests
    requests.forEach(request => {
      const { processId, deviceId, operation = 'read' } = request;
      if (!processId || !deviceId) {
        throw new Error('Process ID and device ID are required for each request');
      }
      ioManager.addIORequest(processId, deviceId, operation);
    });

    res.json({
      message: 'I/O requests added successfully',
      requestCount: requests.length,
      state: ioManager.getSystemState()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Simulate FCFS I/O scheduling
router.post('/simulate/fcfs', (req, res) => {
  try {
    const { timeLimit = 50 } = req.body;

    if (ioManager.statistics.totalRequests === 0) {
      return res.status(400).json({ error: 'No I/O requests added' });
    }

    const result = ioManager.simulateFCFS(timeLimit);

    res.json({
      algorithm: 'First Come First Serve',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate SJF I/O scheduling
router.post('/simulate/sjf', (req, res) => {
  try {
    const { timeLimit = 50 } = req.body;

    if (ioManager.statistics.totalRequests === 0) {
      return res.status(400).json({ error: 'No I/O requests added' });
    }

    const result = ioManager.simulateSJF(timeLimit);

    res.json({
      algorithm: 'Shortest Job First',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate buffering
router.post('/simulate/buffering', (req, res) => {
  try {
    const { producerRate = 2, consumerRate = 3, timeLimit = 20, bufferSize = 5 } = req.body;

    // Reset and add buffer
    ioManager.reset();
    ioManager.addBuffer('main', bufferSize);

    const result = ioManager.simulateBuffering(producerRate, consumerRate, timeLimit);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare I/O scheduling algorithms
router.post('/compare', (req, res) => {
  try {
    const { requests, timeLimit = 50 } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests array is required' });
    }

    const algorithms = ['fcfs', 'sjf'];
    const results = {};

    algorithms.forEach(algorithm => {
      // Create fresh I/O manager for each algorithm
      const tempManager = new IOManager();

      // Add default devices
      const defaultDevices = [
        { deviceId: 'disk1', name: 'Primary Disk', serviceTime: 5 },
        { deviceId: 'disk2', name: 'Secondary Disk', serviceTime: 7 },
        { deviceId: 'printer', name: 'Network Printer', serviceTime: 3 },
        { deviceId: 'scanner', name: 'Document Scanner', serviceTime: 4 }
      ];

      defaultDevices.forEach(device => {
        tempManager.addDevice(device.deviceId, device.name, device.serviceTime);
      });

      // Add requests
      requests.forEach(request => {
        const { processId, deviceId, operation = 'read' } = request;
        tempManager.addIORequest(processId, deviceId, operation);
      });

      // Run simulation
      let result;
      switch (algorithm) {
        case 'fcfs':
          result = tempManager.simulateFCFS(timeLimit);
          break;
        case 'sjf':
          result = tempManager.simulateSJF(timeLimit);
          break;
      }

      results[algorithm] = {
        algorithm: algorithm === 'fcfs' ? 'First Come First Serve' : 'Shortest Job First',
        statistics: result.statistics,
        deviceUtilization: result.devices.map(device => ({
          deviceId: device.deviceId,
          name: device.name,
          utilizationPercentage: device.utilizationPercentage,
          completedRequests: device.completedRequests
        }))
      };
    });

    res.json({
      requests,
      timeLimit,
      comparison: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current I/O system state
router.get('/state', (req, res) => {
  try {
    const state = ioManager.getSystemState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset I/O system
router.post('/reset', (req, res) => {
  try {
    ioManager.reset();

    res.json({
      message: 'I/O system reset',
      state: ioManager.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Interrupt handling simulation
router.post('/interrupts/simulate', (req, res) => {
  try {
    const { requests, timeLimit = 30 } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests array is required' });
    }

    // Reset and setup
    ioManager.reset();

    // Add devices
    const defaultDevices = [
      { deviceId: 'disk1', name: 'Primary Disk', serviceTime: 5 },
      { deviceId: 'keyboard', name: 'Keyboard', serviceTime: 1 },
      { deviceId: 'mouse', name: 'Mouse', serviceTime: 1 }
    ];

    defaultDevices.forEach(device => {
      ioManager.addDevice(device.deviceId, device.name, device.serviceTime);
    });

    // Add requests
    requests.forEach(request => {
      const { processId, deviceId, operation = 'read' } = request;
      ioManager.addIORequest(processId, deviceId, operation);
    });

    // Run simulation
    const result = ioManager.simulateFCFS(timeLimit);

    res.json({
      algorithm: 'Interrupt-Driven I/O',
      ...result,
      interruptLog: ioManager.interrupts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device management
router.get('/devices', (req, res) => {
  try {
    const devices = Array.from(ioManager.devices.values()).map(device => ({
      deviceId: device.deviceId,
      name: device.name,
      serviceTime: device.serviceTime,
      isIdle: device.isIdle,
      queueLength: device.requestQueue.length,
      completedRequests: device.completedRequests.length,
      utilizationPercentage: device.utilizationPercentage
    }));

    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;