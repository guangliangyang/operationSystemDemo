const express = require('express');
const { MultilevelQueueScheduler } = require('../algorithms/multilevelQueue');

const router = express.Router();

// Create scheduler instance
let scheduler = new MultilevelQueueScheduler();

// Get multilevel queue scheduling info
router.get('/info', (req, res) => {
  res.json({
    name: 'Multilevel Queue Scheduling',
    description: 'Advanced CPU scheduling with multiple priority queues',
    features: [
      'Multiple priority queues with different algorithms',
      'Queue-specific time quantum settings',
      'Feedback mechanism for process migration',
      'Aging to prevent starvation',
      'Preemptive scheduling between queues'
    ],
    algorithms: [
      { name: 'FCFS', description: 'First Come First Served' },
      { name: 'SJF', description: 'Shortest Job First' },
      { name: 'RoundRobin', description: 'Round Robin with time quantum' },
      { name: 'Priority', description: 'Priority-based scheduling' }
    ],
    queueTypes: [
      { name: 'System', description: 'Highest priority system processes' },
      { name: 'Interactive', description: 'User interactive processes' },
      { name: 'Batch', description: 'Batch processing jobs' },
      { name: 'Background', description: 'Lowest priority background tasks' }
    ]
  });
});

// Reset scheduler
router.post('/reset', (req, res) => {
  try {
    scheduler.reset();
    res.json({
      message: 'Multilevel queue scheduler reset successfully',
      state: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current state
router.get('/state', (req, res) => {
  try {
    const state = scheduler.getState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a queue
router.post('/queue', (req, res) => {
  try {
    const { name, priority, algorithm = 'FCFS', timeQuantum = 4 } = req.body;

    if (!name || priority === undefined) {
      return res.status(400).json({ error: 'Queue name and priority are required' });
    }

    if (priority < 0) {
      return res.status(400).json({ error: 'Priority must be non-negative' });
    }

    if (timeQuantum < 1) {
      return res.status(400).json({ error: 'Time quantum must be at least 1' });
    }

    const validAlgorithms = ['FCFS', 'SJF', 'RoundRobin', 'Priority'];
    if (!validAlgorithms.includes(algorithm)) {
      return res.status(400).json({
        error: `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}`
      });
    }

    const queue = scheduler.addQueue(name, priority, algorithm, timeQuantum);

    res.json({
      message: `Queue ${name} added successfully`,
      queue: queue.getState(),
      schedulerState: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a process to a queue
router.post('/process', (req, res) => {
  try {
    const { processId, burstTime, priority = 1, queueName, processType = 'User' } = req.body;

    if (!processId || !burstTime || !queueName) {
      return res.status(400).json({
        error: 'Process ID, burst time, and queue name are required'
      });
    }

    if (burstTime <= 0) {
      return res.status(400).json({ error: 'Burst time must be positive' });
    }

    const process = {
      id: processId,
      burstTime,
      priority,
      processType
    };

    const addedProcess = scheduler.addProcess(process, queueName);

    res.json({
      message: `Process ${processId} added to queue ${queueName}`,
      process: addedProcess,
      schedulerState: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable feedback mechanism
router.post('/feedback/enable', (req, res) => {
  try {
    const { promotionThreshold = 10, demotionThreshold = 20 } = req.body;

    if (promotionThreshold <= 0 || demotionThreshold <= 0) {
      return res.status(400).json({ error: 'Thresholds must be positive' });
    }

    scheduler.enableFeedback(promotionThreshold, demotionThreshold);

    res.json({
      message: 'Feedback mechanism enabled',
      promotionThreshold,
      demotionThreshold,
      schedulerState: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable feedback mechanism
router.post('/feedback/disable', (req, res) => {
  try {
    scheduler.disableFeedback();

    res.json({
      message: 'Feedback mechanism disabled',
      schedulerState: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run simulation
router.post('/simulate', (req, res) => {
  try {
    const { maxTime = 100 } = req.body;

    if (maxTime <= 0) {
      return res.status(400).json({ error: 'Max time must be positive' });
    }

    if (scheduler.totalProcesses === 0) {
      return res.status(400).json({ error: 'No processes to simulate' });
    }

    const result = scheduler.simulate(maxTime);

    res.json({
      message: 'Simulation completed',
      simulation: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create standard multilevel queue configuration
router.post('/presets/standard', (req, res) => {
  try {
    scheduler.createStandardMLQ();

    res.json({
      message: 'Standard multilevel queue configuration created',
      description: 'System (FCFS) -> Interactive (RR) -> Batch (SJF) -> Background (FCFS)',
      schedulerState: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create feedback multilevel queue configuration
router.post('/presets/feedback', (req, res) => {
  try {
    scheduler.createFeedbackMLQ();

    res.json({
      message: 'Feedback multilevel queue configuration created',
      description: 'Q0 (RR-2) -> Q1 (RR-4) -> Q2 (RR-8) -> Q3 (FCFS) with feedback',
      schedulerState: scheduler.getState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run classic multilevel feedback queue example
router.post('/demo/classic', (req, res) => {
  try {
    const result = scheduler.simulateClassicExample();

    res.json({
      message: 'Classic multilevel feedback queue demo completed',
      description: 'Demonstrates process migration between queues with feedback',
      simulation: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue statistics
router.get('/statistics', (req, res) => {
  try {
    const state = scheduler.getState();
    const totalProcesses = state.totalProcesses;
    const completedProcesses = state.completedProcesses;

    const queueStats = state.queues.map(queue => ({
      name: queue.name,
      priority: queue.priority,
      algorithm: queue.algorithm,
      processCount: queue.processCount,
      completedCount: queue.completedProcesses.length,
      averageWaitTime: queue.averageWaitTime,
      averageTurnaroundTime: queue.averageTurnaroundTime,
      utilization: queue.completedProcesses.length / Math.max(totalProcesses, 1) * 100
    }));

    res.json({
      totalProcesses,
      completedProcesses,
      currentTime: state.currentTime,
      isRunning: state.isRunning,
      feedbackEnabled: state.feedback,
      queueStatistics: queueStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare with other scheduling algorithms
router.post('/compare', (req, res) => {
  try {
    const { processes } = req.body;

    if (!processes || !Array.isArray(processes) || processes.length === 0) {
      return res.status(400).json({ error: 'Process array is required' });
    }

    // Create three different configurations for comparison
    const configs = [
      { name: 'Standard MLQ', setup: () => scheduler.createStandardMLQ() },
      { name: 'Feedback MLQ', setup: () => scheduler.createFeedbackMLQ() },
      { name: 'Single Queue RR', setup: () => {
        scheduler.reset();
        scheduler.addQueue('Main', 0, 'RoundRobin', 4);
      }}
    ];

    const results = configs.map(config => {
      config.setup();

      // Add processes to appropriate queues
      processes.forEach(process => {
        const queueName = scheduler.queues.length > 1 ?
          (process.processType === 'System' ? 'System' :
           process.processType === 'Interactive' ? 'Interactive' :
           process.processType === 'Batch' ? 'Batch' : 'Background') :
          scheduler.queues[0].name;

        scheduler.addProcess(process, queueName);
      });

      const simulation = scheduler.simulate(100);

      return {
        configuration: config.name,
        averageWaitTime: simulation.averageWaitTime,
        averageTurnaroundTime: simulation.averageTurnaroundTime,
        throughput: simulation.throughput,
        cpuUtilization: simulation.cpuUtilization,
        totalTime: simulation.totalTime
      };
    });

    res.json({
      message: 'Scheduling algorithm comparison completed',
      processCount: processes.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;