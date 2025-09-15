const express = require('express');
const { ProcessScheduler } = require('../algorithms/processScheduling');

const router = express.Router();

// Create scheduler instance
let scheduler = new ProcessScheduler();

// Get all scheduling algorithms
router.get('/algorithms', (req, res) => {
  res.json({
    algorithms: [
      { id: 'fcfs', name: 'First Come First Serve', description: 'Processes are executed in the order they arrive' },
      { id: 'sjf', name: 'Shortest Job First', description: 'Process with shortest burst time is executed first' },
      { id: 'rr', name: 'Round Robin', description: 'Each process gets a fixed time slice in rotation' },
      { id: 'priority', name: 'Priority Scheduling', description: 'Process with highest priority is executed first' }
    ]
  });
});

// Add processes
router.post('/processes', (req, res) => {
  try {
    const { processes } = req.body;

    if (!processes || !Array.isArray(processes)) {
      return res.status(400).json({ error: 'Processes array is required' });
    }

    scheduler.reset();

    processes.forEach(p => {
      if (!p.id || p.arrivalTime === undefined || !p.burstTime) {
        throw new Error('Each process must have id, arrivalTime, and burstTime');
      }
      scheduler.addProcess(p.id, p.arrivalTime, p.burstTime, p.priority || 0);
    });

    res.json({
      message: 'Processes added successfully',
      processCount: processes.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Execute FCFS algorithm
router.post('/schedule/fcfs', (req, res) => {
  try {
    if (scheduler.processes.length === 0) {
      return res.status(400).json({ error: 'No processes added. Please add processes first.' });
    }

    const result = scheduler.fcfs();
    res.json({
      algorithm: 'First Come First Serve',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute SJF algorithm
router.post('/schedule/sjf', (req, res) => {
  try {
    if (scheduler.processes.length === 0) {
      return res.status(400).json({ error: 'No processes added. Please add processes first.' });
    }

    const result = scheduler.sjf();
    res.json({
      algorithm: 'Shortest Job First',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute Round Robin algorithm
router.post('/schedule/roundrobin', (req, res) => {
  try {
    if (scheduler.processes.length === 0) {
      return res.status(400).json({ error: 'No processes added. Please add processes first.' });
    }

    const { timeQuantum = 2 } = req.body;

    if (timeQuantum <= 0) {
      return res.status(400).json({ error: 'Time quantum must be greater than 0' });
    }

    const result = scheduler.roundRobin(timeQuantum);
    res.json({
      algorithm: 'Round Robin',
      timeQuantum,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute Priority Scheduling algorithm
router.post('/schedule/priority', (req, res) => {
  try {
    if (scheduler.processes.length === 0) {
      return res.status(400).json({ error: 'No processes added. Please add processes first.' });
    }

    const result = scheduler.priorityScheduling();
    res.json({
      algorithm: 'Priority Scheduling',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare all algorithms
router.post('/schedule/compare', (req, res) => {
  try {
    if (scheduler.processes.length === 0) {
      return res.status(400).json({ error: 'No processes added. Please add processes first.' });
    }

    const { timeQuantum = 2 } = req.body;

    // Save original processes state
    const originalProcesses = scheduler.processes.map(p => ({ ...p }));

    // Run all algorithms
    const fcfsResult = scheduler.fcfs();

    // Reset processes for next algorithm
    scheduler.processes = originalProcesses.map(p => ({ ...p }));
    const sjfResult = scheduler.sjf();

    scheduler.processes = originalProcesses.map(p => ({ ...p }));
    const rrResult = scheduler.roundRobin(timeQuantum);

    scheduler.processes = originalProcesses.map(p => ({ ...p }));
    const priorityResult = scheduler.priorityScheduling();

    // Restore original state
    scheduler.processes = originalProcesses;

    res.json({
      comparison: {
        fcfs: {
          algorithm: 'First Come First Serve',
          metrics: fcfsResult.metrics
        },
        sjf: {
          algorithm: 'Shortest Job First',
          metrics: sjfResult.metrics
        },
        roundRobin: {
          algorithm: 'Round Robin',
          timeQuantum,
          metrics: rrResult.metrics
        },
        priority: {
          algorithm: 'Priority Scheduling',
          metrics: priorityResult.metrics
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current processes
router.get('/processes', (req, res) => {
  res.json({
    processes: scheduler.processes.map(p => ({
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority
    })),
    count: scheduler.processes.length
  });
});

// Clear all processes
router.delete('/processes', (req, res) => {
  scheduler.reset();
  res.json({ message: 'All processes cleared' });
});

module.exports = router;