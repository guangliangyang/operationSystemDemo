class Queue {
  constructor(name, priority, algorithm = 'FCFS', timeQuantum = 4) {
    this.name = name;
    this.priority = priority; // Lower number = higher priority
    this.algorithm = algorithm;
    this.timeQuantum = timeQuantum;
    this.processes = [];
    this.completedProcesses = [];
    this.currentTime = 0;
    this.totalWaitTime = 0;
    this.totalTurnaroundTime = 0;
  }

  addProcess(process) {
    const queueProcess = {
      ...process,
      arrivalTime: this.currentTime,
      remainingTime: process.burstTime,
      waitTime: 0,
      turnaroundTime: 0,
      startTime: null,
      completionTime: null,
      responseTime: null
    };
    this.processes.push(queueProcess);
  }

  getNextProcess() {
    if (this.processes.length === 0) return null;

    switch (this.algorithm) {
      case 'FCFS':
        return this.processes.shift();

      case 'SJF':
        // Sort by remaining time (shortest first)
        this.processes.sort((a, b) => a.remainingTime - b.remainingTime);
        return this.processes.shift();

      case 'Priority':
        // Sort by priority (lower number = higher priority)
        this.processes.sort((a, b) => a.priority - b.priority);
        return this.processes.shift();

      case 'RoundRobin':
        return this.processes.shift();

      default:
        return this.processes.shift();
    }
  }

  getState() {
    return {
      name: this.name,
      priority: this.priority,
      algorithm: this.algorithm,
      timeQuantum: this.timeQuantum,
      processCount: this.processes.length,
      processes: [...this.processes],
      completedProcesses: [...this.completedProcesses],
      currentTime: this.currentTime,
      averageWaitTime: this.completedProcesses.length > 0 ?
        this.totalWaitTime / this.completedProcesses.length : 0,
      averageTurnaroundTime: this.completedProcesses.length > 0 ?
        this.totalTurnaroundTime / this.completedProcesses.length : 0
    };
  }

  completeProcess(process) {
    process.completionTime = this.currentTime;
    process.turnaroundTime = process.completionTime - process.arrivalTime;
    process.waitTime = process.turnaroundTime - process.burstTime;

    this.totalWaitTime += process.waitTime;
    this.totalTurnaroundTime += process.turnaroundTime;
    this.completedProcesses.push(process);
  }
}

class MultilevelQueueScheduler {
  constructor() {
    this.queues = [];
    this.currentTime = 0;
    this.timeline = [];
    this.totalProcesses = 0;
    this.completedProcesses = 0;
    this.isRunning = false;
    this.feedback = false; // If true, processes can move between queues
  }

  addQueue(name, priority, algorithm = 'FCFS', timeQuantum = 4) {
    const queue = new Queue(name, priority, algorithm, timeQuantum);
    this.queues.push(queue);
    // Sort queues by priority (lower number = higher priority)
    this.queues.sort((a, b) => a.priority - b.priority);
    return queue;
  }

  addProcess(process, queueName) {
    const queue = this.queues.find(q => q.name === queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const enhancedProcess = {
      ...process,
      id: process.id || `P${this.totalProcesses + 1}`,
      originalQueue: queueName,
      currentQueue: queueName,
      timesPromoted: 0,
      timesDemoted: 0
    };

    queue.addProcess(enhancedProcess);
    this.totalProcesses++;

    return enhancedProcess;
  }

  // Multi-level queue with feedback - processes can move between queues
  enableFeedback(promotionThreshold = 10, demotionThreshold = 20) {
    this.feedback = true;
    this.promotionThreshold = promotionThreshold;
    this.demotionThreshold = demotionThreshold;
  }

  disableFeedback() {
    this.feedback = false;
  }

  promoteProcess(process) {
    if (!this.feedback) return false;

    const currentQueueIndex = this.queues.findIndex(q => q.name === process.currentQueue);
    if (currentQueueIndex > 0) { // Can promote (move to higher priority queue)
      const currentQueue = this.queues[currentQueueIndex];
      const higherPriorityQueue = this.queues[currentQueueIndex - 1];

      // Remove from current queue
      const processIndex = currentQueue.processes.findIndex(p => p.id === process.id);
      if (processIndex !== -1) {
        currentQueue.processes.splice(processIndex, 1);

        // Add to higher priority queue
        process.currentQueue = higherPriorityQueue.name;
        process.timesPromoted++;
        higherPriorityQueue.processes.push(process);

        return true;
      }
    }
    return false;
  }

  demoteProcess(process) {
    if (!this.feedback) return false;

    const currentQueueIndex = this.queues.findIndex(q => q.name === process.currentQueue);
    if (currentQueueIndex < this.queues.length - 1) { // Can demote (move to lower priority queue)
      const currentQueue = this.queues[currentQueueIndex];
      const lowerPriorityQueue = this.queues[currentQueueIndex + 1];

      // Remove from current queue
      const processIndex = currentQueue.processes.findIndex(p => p.id === process.id);
      if (processIndex !== -1) {
        currentQueue.processes.splice(processIndex, 1);

        // Add to lower priority queue
        process.currentQueue = lowerPriorityQueue.name;
        process.timesDemoted++;
        lowerPriorityQueue.processes.push(process);

        return true;
      }
    }
    return false;
  }

  getNextQueueWithProcesses() {
    for (const queue of this.queues) {
      if (queue.processes.length > 0) {
        return queue;
      }
    }
    return null;
  }

  simulate(maxTime = 100) {
    this.isRunning = true;
    const ganttChart = [];
    let currentProcess = null;
    let timeInCurrentProcess = 0;

    while (this.currentTime < maxTime && this.completedProcesses < this.totalProcesses) {
      // If no current process, get next from highest priority queue
      if (!currentProcess) {
        const nextQueue = this.getNextQueueWithProcesses();
        if (!nextQueue) {
          // No processes to run, advance time
          this.currentTime++;
          ganttChart.push({
            time: this.currentTime,
            processId: 'IDLE',
            queueName: 'IDLE',
            action: 'idle'
          });
          continue;
        }

        currentProcess = nextQueue.getNextProcess();
        if (currentProcess) {
          timeInCurrentProcess = 0;
          if (currentProcess.startTime === null) {
            currentProcess.startTime = this.currentTime;
            currentProcess.responseTime = this.currentTime - currentProcess.arrivalTime;
          }
        }
      }

      if (currentProcess) {
        const currentQueue = this.queues.find(q => q.name === currentProcess.currentQueue);

        // Execute process for 1 time unit
        ganttChart.push({
          time: this.currentTime,
          processId: currentProcess.id,
          queueName: currentProcess.currentQueue,
          algorithm: currentQueue.algorithm,
          remainingTime: currentProcess.remainingTime,
          action: 'executing'
        });

        currentProcess.remainingTime--;
        timeInCurrentProcess++;
        this.currentTime++;

        // Check if process is completed
        if (currentProcess.remainingTime === 0) {
          currentQueue.completeProcess(currentProcess);
          this.completedProcesses++;

          ganttChart.push({
            time: this.currentTime,
            processId: currentProcess.id,
            queueName: currentProcess.currentQueue,
            action: 'completed',
            waitTime: currentProcess.waitTime,
            turnaroundTime: currentProcess.turnaroundTime
          });

          currentProcess = null;
          timeInCurrentProcess = 0;
        }
        // Check for preemption based on queue algorithm
        else {
          let shouldPreempt = false;

          if (currentQueue.algorithm === 'RoundRobin' &&
              timeInCurrentProcess >= currentQueue.timeQuantum) {
            shouldPreempt = true;
          }

          // Check for higher priority processes in higher priority queues
          for (let i = 0; i < this.queues.indexOf(currentQueue); i++) {
            if (this.queues[i].processes.length > 0) {
              shouldPreempt = true;
              break;
            }
          }

          if (shouldPreempt) {
            // Return process to its queue (for round robin) or check for feedback
            if (currentQueue.algorithm === 'RoundRobin') {
              currentQueue.processes.push(currentProcess);
            } else {
              currentQueue.processes.unshift(currentProcess); // Put back at front
            }

            // Feedback mechanism
            if (this.feedback && timeInCurrentProcess >= this.demotionThreshold) {
              this.demoteProcess(currentProcess);
            }

            currentProcess = null;
            timeInCurrentProcess = 0;
          }
        }
      }

      // Aging mechanism for feedback queues
      if (this.feedback && this.currentTime % this.promotionThreshold === 0) {
        for (let i = 1; i < this.queues.length; i++) {
          const queue = this.queues[i];
          const processesToPromote = queue.processes.filter(p =>
            (this.currentTime - p.arrivalTime) >= this.promotionThreshold
          );

          processesToPromote.forEach(p => this.promoteProcess(p));
        }
      }
    }

    this.isRunning = false;

    return {
      ganttChart,
      queues: this.queues.map(q => q.getState()),
      totalTime: this.currentTime,
      totalProcesses: this.totalProcesses,
      completedProcesses: this.completedProcesses,
      averageWaitTime: this.calculateAverageWaitTime(),
      averageTurnaroundTime: this.calculateAverageTurnaroundTime(),
      throughput: this.completedProcesses / this.currentTime,
      cpuUtilization: this.calculateCPUUtilization(ganttChart)
    };
  }

  calculateAverageWaitTime() {
    let totalWaitTime = 0;
    let processCount = 0;

    this.queues.forEach(queue => {
      totalWaitTime += queue.totalWaitTime;
      processCount += queue.completedProcesses.length;
    });

    return processCount > 0 ? totalWaitTime / processCount : 0;
  }

  calculateAverageTurnaroundTime() {
    let totalTurnaroundTime = 0;
    let processCount = 0;

    this.queues.forEach(queue => {
      totalTurnaroundTime += queue.totalTurnaroundTime;
      processCount += queue.completedProcesses.length;
    });

    return processCount > 0 ? totalTurnaroundTime / processCount : 0;
  }

  calculateCPUUtilization(ganttChart) {
    const executingTime = ganttChart.filter(entry => entry.action === 'executing').length;
    return ganttChart.length > 0 ? (executingTime / ganttChart.length) * 100 : 0;
  }

  getState() {
    return {
      queues: this.queues.map(q => q.getState()),
      currentTime: this.currentTime,
      totalProcesses: this.totalProcesses,
      completedProcesses: this.completedProcesses,
      isRunning: this.isRunning,
      feedback: this.feedback,
      promotionThreshold: this.promotionThreshold,
      demotionThreshold: this.demotionThreshold
    };
  }

  reset() {
    this.queues = [];
    this.currentTime = 0;
    this.timeline = [];
    this.totalProcesses = 0;
    this.completedProcesses = 0;
    this.isRunning = false;
    this.feedback = false;
  }

  // Predefined queue configurations
  createStandardMLQ() {
    this.reset();
    this.addQueue('System', 0, 'FCFS', 1);        // Highest priority - system processes
    this.addQueue('Interactive', 1, 'RoundRobin', 4); // Interactive processes
    this.addQueue('Batch', 2, 'SJF', 8);         // Batch processes
    this.addQueue('Background', 3, 'FCFS', 16);  // Lowest priority - background
  }

  createFeedbackMLQ() {
    this.reset();
    this.addQueue('Q0', 0, 'RoundRobin', 2);     // Highest priority, small quantum
    this.addQueue('Q1', 1, 'RoundRobin', 4);     // Medium priority, medium quantum
    this.addQueue('Q2', 2, 'RoundRobin', 8);     // Lower priority, larger quantum
    this.addQueue('Q3', 3, 'FCFS', 16);         // Lowest priority, FCFS
    this.enableFeedback(10, 8);                  // Enable feedback with thresholds
  }

  // Simulate classic multilevel feedback queue example
  simulateClassicExample() {
    this.createFeedbackMLQ();

    // Add various types of processes
    const processes = [
      { id: 'P1', burstTime: 15, priority: 1, processType: 'Interactive' },
      { id: 'P2', burstTime: 8, priority: 2, processType: 'Batch' },
      { id: 'P3', burstTime: 20, priority: 1, processType: 'Interactive' },
      { id: 'P4', burstTime: 5, priority: 3, processType: 'System' },
      { id: 'P5', burstTime: 12, priority: 2, processType: 'Batch' }
    ];

    // All processes start in Q0 (highest priority)
    processes.forEach(process => {
      this.addProcess(process, 'Q0');
    });

    return this.simulate(100);
  }
}

module.exports = { MultilevelQueueScheduler, Queue };