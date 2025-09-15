const express = require('express');
const { DeadlockDetector } = require('../algorithms/deadlock');

const router = express.Router();

// Create deadlock detector instance
let deadlockDetector = new DeadlockDetector();

// Get deadlock detection info
router.get('/info', (req, res) => {
  res.json({
    algorithms: [
      {
        id: 'bankers',
        name: "Banker's Algorithm",
        description: 'Deadlock avoidance using safe state checking'
      },
      {
        id: 'rag',
        name: 'Resource Allocation Graph',
        description: 'Deadlock detection using cycle detection in resource allocation graph'
      },
      {
        id: 'prevention',
        name: 'Deadlock Prevention',
        description: 'Prevent deadlock by checking if resource allocation leads to safe state'
      }
    ]
  });
});

// Reset deadlock detector
router.post('/reset', (req, res) => {
  try {
    deadlockDetector.reset();
    res.json({
      message: 'Deadlock detector reset successfully',
      state: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system state
router.get('/state', (req, res) => {
  try {
    const state = deadlockDetector.getSystemState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add resource
router.post('/resource', (req, res) => {
  try {
    const { resourceId, name, totalInstances = 1 } = req.body;

    if (!resourceId || !name) {
      return res.status(400).json({ error: 'Resource ID and name are required' });
    }

    if (totalInstances < 1) {
      return res.status(400).json({ error: 'Total instances must be at least 1' });
    }

    const resource = deadlockDetector.addResource(resourceId, name, totalInstances);

    res.json({
      message: `Resource ${name} (${resourceId}) added successfully`,
      resource: resource.getState(),
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add process
router.post('/process', (req, res) => {
  try {
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    deadlockDetector.addProcess(processId);

    res.json({
      message: `Process ${processId} added successfully`,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request resource
router.post('/request', (req, res) => {
  try {
    const { processId, resourceId, instances = 1 } = req.body;

    if (!processId || !resourceId) {
      return res.status(400).json({ error: 'Process ID and Resource ID are required' });
    }

    if (instances < 1) {
      return res.status(400).json({ error: 'Instances must be at least 1' });
    }

    const result = deadlockDetector.requestResource(processId, resourceId, instances);

    res.json({
      operation: 'request',
      processId,
      resourceId,
      instances,
      ...result,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Release resource
router.post('/release', (req, res) => {
  try {
    const { processId, resourceId, instances = 1 } = req.body;

    if (!processId || !resourceId) {
      return res.status(400).json({ error: 'Process ID and Resource ID are required' });
    }

    if (instances < 1) {
      return res.status(400).json({ error: 'Instances must be at least 1' });
    }

    const result = deadlockDetector.releaseResource(processId, resourceId, instances);

    res.json({
      operation: 'release',
      processId,
      resourceId,
      instances,
      ...result,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check safe state using Banker's Algorithm
router.get('/safety-check', (req, res) => {
  try {
    const safetyCheck = deadlockDetector.isSafeState();

    res.json({
      algorithm: "Banker's Algorithm",
      timestamp: new Date().toISOString(),
      ...safetyCheck,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detect deadlock using Resource Allocation Graph
router.get('/deadlock-detection', (req, res) => {
  try {
    const deadlockCheck = deadlockDetector.detectDeadlockRAG();

    res.json({
      algorithm: 'Resource Allocation Graph',
      timestamp: new Date().toISOString(),
      ...deadlockCheck,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if request can be granted safely (deadlock prevention)
router.post('/can-grant', (req, res) => {
  try {
    const { processId, resourceId, instances = 1 } = req.body;

    if (!processId || !resourceId) {
      return res.status(400).json({ error: 'Process ID and Resource ID are required' });
    }

    if (instances < 1) {
      return res.status(400).json({ error: 'Instances must be at least 1' });
    }

    const canGrantCheck = deadlockDetector.canGrantRequestSafely(processId, resourceId, instances);

    res.json({
      algorithm: 'Deadlock Prevention',
      processId,
      resourceId,
      instances,
      timestamp: new Date().toISOString(),
      ...canGrantCheck,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate classic deadlock scenario
router.post('/simulate', (req, res) => {
  try {
    const simulation = deadlockDetector.simulateDeadlockScenario();

    res.json({
      message: 'Deadlock simulation completed',
      ...simulation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource allocation graph
router.get('/resource-graph', (req, res) => {
  try {
    const graph = deadlockDetector.buildResourceAllocationGraph();

    res.json({
      algorithm: 'Resource Allocation Graph',
      timestamp: new Date().toISOString(),
      graph,
      systemState: deadlockDetector.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system history
router.get('/history', (req, res) => {
  try {
    const state = deadlockDetector.getSystemState();

    res.json({
      history: state.history,
      currentTime: state.currentTime,
      totalEvents: state.history.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;