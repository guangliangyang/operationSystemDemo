const express = require('express');
const { RealTimeScheduler } = require('../algorithms/realTimeScheduling');

const router = express.Router();

// Create scheduler instance
let scheduler = new RealTimeScheduler();

// Get real-time scheduling info
router.get('/info', (req, res) => {
  res.json({
    name: 'Real-Time Scheduling Algorithms',
    description: 'CPU scheduling algorithms designed for real-time systems with timing constraints',
    features: [
      'Deadline-aware scheduling',
      'Schedulability analysis',
      'Preemptive algorithms',
      'Utilization bound testing',
      'Slack time calculation',
      'Deadline miss detection',
      'Response time analysis'
    ],
    algorithms: [
      {
        name: 'Rate Monotonic Scheduling (RMS)',
        description: 'Static priority assignment based on task periods',
        characteristics: ['Fixed priority', 'Preemptive', 'Optimal for fixed priorities']
      },
      {
        name: 'Earliest Deadline First (EDF)',
        description: 'Dynamic priority based on absolute deadlines',
        characteristics: ['Dynamic priority', 'Preemptive', 'Optimal for single processor']
      },
      {
        name: 'Deadline Monotonic Scheduling (DMS)',
        description: 'Static priority assignment based on relative deadlines',
        characteristics: ['Fixed priority', 'Preemptive', 'Generalization of RMS']
      },
      {
        name: 'Least Slack Time First (LST)',
        description: 'Dynamic priority based on slack time',
        characteristics: ['Dynamic priority', 'Preemptive', 'High overhead']
      }
    ],
    concepts: [
      'Period: Time interval between task releases',
      'Deadline: Maximum completion time for a task',
      'Utilization: Fraction of CPU time required by tasks',
      'Hyperperiod: LCM of all task periods',
      'Slack time: Deadline - current_time - remaining_execution_time'
    ]
  });
});

// Reset scheduler
router.post('/reset', (req, res) => {
  try {
    scheduler = new RealTimeScheduler();
    res.json({
      message: 'Real-time scheduler reset successfully',
      state: scheduler.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current state
router.get('/state', (req, res) => {
  try {
    const state = scheduler.getSystemState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add real-time task
router.post('/task', (req, res) => {
  try {
    const { taskId, executionTime, period, deadline, priority = 0 } = req.body;

    if (!taskId || !executionTime || !period) {
      return res.status(400).json({ error: 'Task ID, execution time, and period are required' });
    }

    if (executionTime <= 0 || period <= 0) {
      return res.status(400).json({ error: 'Execution time and period must be positive' });
    }

    if (deadline && deadline <= 0) {
      return res.status(400).json({ error: 'Deadline must be positive' });
    }

    if (deadline && deadline > period) {
      return res.status(400).json({ error: 'Deadline cannot be greater than period' });
    }

    if (executionTime > (deadline || period)) {
      return res.status(400).json({ error: 'Execution time cannot exceed deadline' });
    }

    const task = scheduler.addTask(taskId, executionTime, period, deadline, priority);

    res.json({
      message: `Real-time task ${taskId} added successfully`,
      task: {
        id: task.id,
        executionTime: task.executionTime,
        period: task.period,
        deadline: task.deadline,
        priority: task.priority,
        utilization: task.getUtilization()
      },
      systemState: scheduler.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rate Monotonic Scheduling
router.post('/schedule/rms', (req, res) => {
  try {
    const { simulationTime } = req.body;

    if (scheduler.tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to schedule' });
    }

    if (simulationTime && simulationTime <= 0) {
      return res.status(400).json({ error: 'Simulation time must be positive' });
    }

    const result = scheduler.rateMonotonicScheduling(simulationTime);

    res.json({
      message: 'Rate Monotonic Scheduling completed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Earliest Deadline First
router.post('/schedule/edf', (req, res) => {
  try {
    const { simulationTime } = req.body;

    if (scheduler.tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to schedule' });
    }

    if (simulationTime && simulationTime <= 0) {
      return res.status(400).json({ error: 'Simulation time must be positive' });
    }

    const result = scheduler.earliestDeadlineFirst(simulationTime);

    res.json({
      message: 'Earliest Deadline First scheduling completed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deadline Monotonic Scheduling
router.post('/schedule/dms', (req, res) => {
  try {
    const { simulationTime } = req.body;

    if (scheduler.tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to schedule' });
    }

    if (simulationTime && simulationTime <= 0) {
      return res.status(400).json({ error: 'Simulation time must be positive' });
    }

    const result = scheduler.deadlineMonotonicScheduling(simulationTime);

    res.json({
      message: 'Deadline Monotonic Scheduling completed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Least Slack Time First
router.post('/schedule/lst', (req, res) => {
  try {
    const { simulationTime } = req.body;

    if (scheduler.tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to schedule' });
    }

    if (simulationTime && simulationTime <= 0) {
      return res.status(400).json({ error: 'Simulation time must be positive' });
    }

    const result = scheduler.leastSlackTimeFirst(simulationTime);

    res.json({
      message: 'Least Slack Time First scheduling completed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedulability analysis
router.get('/analysis/schedulability', (req, res) => {
  try {
    if (scheduler.tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to analyze' });
    }

    const state = scheduler.getSystemState();
    const n = scheduler.tasks.length;
    const utilizationBound = n * (Math.pow(2, 1/n) - 1);

    const analysis = {
      totalUtilization: state.totalUtilization,
      rmsUtilizationBound: utilizationBound,
      rmsSchedulable: state.totalUtilization <= utilizationBound,
      edfSchedulable: state.totalUtilization <= 1.0,
      hyperPeriod: state.hyperPeriod,
      taskCount: state.tasks.length,
      taskAnalysis: state.tasks.map(task => ({
        taskId: task.id,
        utilization: task.utilization,
        period: task.period,
        deadline: task.deadline,
        executionTime: task.executionTime,
        deadlineTest: task.executionTime <= task.deadline
      }))
    };

    res.json({
      analysis: 'Real-Time Schedulability Analysis',
      timestamp: new Date().toISOString(),
      ...analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare scheduling algorithms
router.post('/compare', (req, res) => {
  try {
    const { simulationTime, algorithms = ['rms', 'edf', 'dms', 'lst'] } = req.body;

    if (scheduler.tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to compare' });
    }

    const results = {};

    // Save original state
    const originalTasks = JSON.parse(JSON.stringify(scheduler.tasks));

    if (algorithms.includes('rms')) {
      scheduler.tasks = JSON.parse(JSON.stringify(originalTasks));
      results.rms = scheduler.rateMonotonicScheduling(simulationTime);
    }

    if (algorithms.includes('edf')) {
      scheduler.tasks = JSON.parse(JSON.stringify(originalTasks));
      results.edf = scheduler.earliestDeadlineFirst(simulationTime);
    }

    if (algorithms.includes('dms')) {
      scheduler.tasks = JSON.parse(JSON.stringify(originalTasks));
      results.dms = scheduler.deadlineMonotonicScheduling(simulationTime);
    }

    if (algorithms.includes('lst')) {
      scheduler.tasks = JSON.parse(JSON.stringify(originalTasks));
      results.lst = scheduler.leastSlackTimeFirst(simulationTime);
    }

    // Restore original state
    scheduler.tasks = originalTasks;

    const comparison = {
      algorithms: algorithms,
      results: Object.entries(results).map(([alg, result]) => ({
        algorithm: alg.toUpperCase(),
        schedulable: result.isSchedulable !== undefined ? result.isSchedulable : 'N/A',
        successRate: result.statistics.successRate,
        missedDeadlines: result.statistics.missedDeadlines,
        preemptions: result.statistics.preemptions,
        contextSwitches: result.statistics.contextSwitches,
        cpuUtilization: result.statistics.cpuUtilization
      }))
    };

    res.json({
      message: 'Real-time scheduling algorithm comparison completed',
      comparison,
      detailedResults: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preset task sets
router.post('/presets/periodic', (req, res) => {
  try {
    scheduler.createPeriodicTaskSet();

    res.json({
      message: 'Periodic task set created',
      description: 'Standard periodic tasks: T1(3,10), T2(2,15), T3(1,20)',
      systemState: scheduler.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/presets/hard-realtime', (req, res) => {
  try {
    scheduler.createHardRealTimeTaskSet();

    res.json({
      message: 'Hard real-time task set created',
      description: 'Hard real-time tasks with tight deadlines: T1(2,5), T2(3,10,8), T3(4,15,12)',
      systemState: scheduler.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo scenarios
router.post('/demo/schedulability', (req, res) => {
  try {
    // Create a task set that tests schedulability boundaries
    scheduler = new RealTimeScheduler();

    // Task set with utilization close to RMS bound
    scheduler.addTask('T1', 1, 4, 4);    // U = 0.25
    scheduler.addTask('T2', 2, 6, 6);    // U = 0.33
    scheduler.addTask('T3', 1, 8, 8);    // U = 0.125
    // Total utilization = 0.705

    const state = scheduler.getSystemState();
    const n = scheduler.tasks.length;
    const rmsUtilizationBound = n * (Math.pow(2, 1/n) - 1);

    const results = {
      rms: scheduler.rateMonotonicScheduling(24),
      edf: null
    };

    // Reset for EDF
    scheduler.tasks.forEach(task => {
      task.completedJobs = 0;
      task.missedDeadlines = 0;
      task.jobHistory = [];
    });

    results.edf = scheduler.earliestDeadlineFirst(24);

    res.json({
      demo: 'Schedulability Analysis Demo',
      description: 'Compare RMS and EDF for tasks near utilization bound',
      taskSet: state.tasks,
      totalUtilization: state.totalUtilization,
      rmsUtilizationBound,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed statistics
router.get('/statistics', (req, res) => {
  try {
    const state = scheduler.getSystemState();

    if (state.tasks.length === 0) {
      return res.json({
        message: 'No tasks available for statistics',
        taskCount: 0
      });
    }

    const statistics = {
      timestamp: new Date().toISOString(),
      systemOverview: {
        taskCount: state.tasks.length,
        totalUtilization: state.totalUtilization,
        hyperPeriod: state.hyperPeriod,
        currentTime: state.currentTime
      },
      utilizationAnalysis: {
        utilizationPercentage: state.totalUtilization * 100,
        rmsUtilizationBound: state.tasks.length * (Math.pow(2, 1/state.tasks.length) - 1),
        edfUtilizationBound: 1.0,
        isRMSSchedulable: state.totalUtilization <= state.tasks.length * (Math.pow(2, 1/state.tasks.length) - 1),
        isEDFSchedulable: state.totalUtilization <= 1.0
      },
      taskDetails: state.tasks.map(task => ({
        taskId: task.id,
        period: task.period,
        executionTime: task.executionTime,
        deadline: task.deadline,
        utilization: task.utilization,
        utilizationPercentage: task.utilization * 100,
        completedJobs: task.completedJobs,
        missedDeadlines: task.missedDeadlines
      }))
    };

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;