const express = require('express');
const { SynchronizationManager } = require('../algorithms/synchronization');

const router = express.Router();

// Create synchronization manager instance
let syncManager = new SynchronizationManager();

// Get synchronization primitives info
router.get('/primitives', (req, res) => {
  res.json({
    primitives: [
      {
        id: 'semaphore',
        name: 'Semaphore',
        description: 'Counting semaphore for resource management and process synchronization'
      },
      {
        id: 'mutex',
        name: 'Mutex (Binary Semaphore)',
        description: 'Mutual exclusion lock for critical section protection'
      },
      {
        id: 'monitor',
        name: 'Monitor',
        description: 'High-level synchronization construct with condition variables'
      }
    ]
  });
});

// Reset synchronization manager
router.post('/reset', (req, res) => {
  try {
    syncManager.reset();
    res.json({
      message: 'Synchronization manager reset successfully',
      state: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current state of all synchronization primitives
router.get('/state', (req, res) => {
  try {
    const state = syncManager.getAllStates();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Semaphore Routes

// Create semaphore
router.post('/semaphore/create', (req, res) => {
  try {
    const { name, initialValue = 1 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Semaphore name is required' });
    }

    if (initialValue < 0) {
      return res.status(400).json({ error: 'Initial value cannot be negative' });
    }

    const semaphore = syncManager.createSemaphore(name, initialValue);

    res.json({
      message: `Semaphore ${name} created successfully`,
      semaphore: semaphore.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Semaphore wait operation
router.post('/semaphore/:name/wait', (req, res) => {
  try {
    const { name } = req.params;
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const semaphore = syncManager.getSemaphore(name);
    if (!semaphore) {
      return res.status(404).json({ error: `Semaphore ${name} not found` });
    }

    const result = semaphore.wait(processId);

    res.json({
      operation: 'wait',
      semaphoreName: name,
      processId,
      ...result,
      semaphoreState: semaphore.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Semaphore signal operation
router.post('/semaphore/:name/signal', (req, res) => {
  try {
    const { name } = req.params;
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const semaphore = syncManager.getSemaphore(name);
    if (!semaphore) {
      return res.status(404).json({ error: `Semaphore ${name} not found` });
    }

    const result = semaphore.signal(processId);

    res.json({
      operation: 'signal',
      semaphoreName: name,
      processId,
      ...result,
      semaphoreState: semaphore.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mutex Routes

// Create mutex
router.post('/mutex/create', (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Mutex name is required' });
    }

    const mutex = syncManager.createMutex(name);

    res.json({
      message: `Mutex ${name} created successfully`,
      mutex: mutex.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mutex lock operation
router.post('/mutex/:name/lock', (req, res) => {
  try {
    const { name } = req.params;
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const mutex = syncManager.getMutex(name);
    if (!mutex) {
      return res.status(404).json({ error: `Mutex ${name} not found` });
    }

    const result = mutex.lock(processId);

    res.json({
      operation: 'lock',
      mutexName: name,
      processId,
      ...result,
      mutexState: mutex.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mutex unlock operation
router.post('/mutex/:name/unlock', (req, res) => {
  try {
    const { name } = req.params;
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const mutex = syncManager.getMutex(name);
    if (!mutex) {
      return res.status(404).json({ error: `Mutex ${name} not found` });
    }

    const result = mutex.unlock(processId);

    res.json({
      operation: 'unlock',
      mutexName: name,
      processId,
      ...result,
      mutexState: mutex.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monitor Routes

// Create monitor
router.post('/monitor/create', (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Monitor name is required' });
    }

    const monitor = syncManager.createMonitor(name);

    res.json({
      message: `Monitor ${name} created successfully`,
      monitor: monitor.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monitor enter operation
router.post('/monitor/:name/enter', (req, res) => {
  try {
    const { name } = req.params;
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const monitor = syncManager.getMonitor(name);
    if (!monitor) {
      return res.status(404).json({ error: `Monitor ${name} not found` });
    }

    const result = monitor.enter(processId);

    res.json({
      operation: 'enter',
      monitorName: name,
      processId,
      ...result,
      monitorState: monitor.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monitor exit operation
router.post('/monitor/:name/exit', (req, res) => {
  try {
    const { name } = req.params;
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const monitor = syncManager.getMonitor(name);
    if (!monitor) {
      return res.status(404).json({ error: `Monitor ${name} not found` });
    }

    const result = monitor.exit(processId);

    res.json({
      operation: 'exit',
      monitorName: name,
      processId,
      ...result,
      monitorState: monitor.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monitor wait operation
router.post('/monitor/:name/wait', (req, res) => {
  try {
    const { name } = req.params;
    const { processId, conditionName } = req.body;

    if (!processId || !conditionName) {
      return res.status(400).json({ error: 'Process ID and condition name are required' });
    }

    const monitor = syncManager.getMonitor(name);
    if (!monitor) {
      return res.status(404).json({ error: `Monitor ${name} not found` });
    }

    const result = monitor.wait(processId, conditionName);

    res.json({
      operation: 'wait',
      monitorName: name,
      processId,
      conditionName,
      ...result,
      monitorState: monitor.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monitor signal operation
router.post('/monitor/:name/signal', (req, res) => {
  try {
    const { name } = req.params;
    const { processId, conditionName } = req.body;

    if (!processId || !conditionName) {
      return res.status(400).json({ error: 'Process ID and condition name are required' });
    }

    const monitor = syncManager.getMonitor(name);
    if (!monitor) {
      return res.status(404).json({ error: `Monitor ${name} not found` });
    }

    const result = monitor.signal(processId, conditionName);

    res.json({
      operation: 'signal',
      monitorName: name,
      processId,
      conditionName,
      ...result,
      monitorState: monitor.getState(),
      allStates: syncManager.getAllStates()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo Simulations

// Producer-Consumer simulation
router.post('/demo/producer-consumer', (req, res) => {
  try {
    const {
      bufferSize = 5,
      producers = 2,
      consumers = 2,
      timeLimit = 20
    } = req.body;

    if (bufferSize <= 0 || producers <= 0 || consumers <= 0 || timeLimit <= 0) {
      return res.status(400).json({ error: 'All parameters must be positive integers' });
    }

    const result = syncManager.simulateProducerConsumer(bufferSize, producers, consumers, timeLimit);

    res.json({
      demoName: 'Producer-Consumer Problem',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get semaphore by name
router.get('/semaphore/:name', (req, res) => {
  try {
    const { name } = req.params;
    const semaphore = syncManager.getSemaphore(name);

    if (!semaphore) {
      return res.status(404).json({ error: `Semaphore ${name} not found` });
    }

    res.json({
      name,
      state: semaphore.getState(),
      history: semaphore.history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mutex by name
router.get('/mutex/:name', (req, res) => {
  try {
    const { name } = req.params;
    const mutex = syncManager.getMutex(name);

    if (!mutex) {
      return res.status(404).json({ error: `Mutex ${name} not found` });
    }

    res.json({
      name,
      state: mutex.getState(),
      history: mutex.history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitor by name
router.get('/monitor/:name', (req, res) => {
  try {
    const { name } = req.params;
    const monitor = syncManager.getMonitor(name);

    if (!monitor) {
      return res.status(404).json({ error: `Monitor ${name} not found` });
    }

    res.json({
      name,
      state: monitor.getState(),
      history: monitor.history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;