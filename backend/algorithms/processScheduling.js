class Process {
  constructor(id, arrivalTime, burstTime, priority = 0) {
    this.id = id;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.priority = priority;
    this.remainingTime = burstTime;
    this.waitingTime = 0;
    this.turnaroundTime = 0;
    this.completionTime = 0;
    this.startTime = -1;
  }
}

class ProcessScheduler {
  constructor() {
    this.processes = [];
    this.ganttChart = [];
    this.currentTime = 0;
  }

  addProcess(id, arrivalTime, burstTime, priority = 0) {
    this.processes.push(new Process(id, arrivalTime, burstTime, priority));
  }

  reset() {
    this.processes = [];
    this.ganttChart = [];
    this.currentTime = 0;
  }

  // First Come First Serve (FCFS)
  fcfs() {
    this.ganttChart = [];
    this.currentTime = 0;

    // Sort by arrival time
    const sortedProcesses = [...this.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

    sortedProcesses.forEach(process => {
      // If current time is less than arrival time, CPU is idle
      if (this.currentTime < process.arrivalTime) {
        if (this.currentTime !== process.arrivalTime) {
          this.ganttChart.push({
            processId: 'IDLE',
            startTime: this.currentTime,
            endTime: process.arrivalTime,
            duration: process.arrivalTime - this.currentTime
          });
        }
        this.currentTime = process.arrivalTime;
      }

      // Execute process
      process.startTime = this.currentTime;
      process.completionTime = this.currentTime + process.burstTime;
      process.turnaroundTime = process.completionTime - process.arrivalTime;
      process.waitingTime = process.turnaroundTime - process.burstTime;

      this.ganttChart.push({
        processId: process.id,
        startTime: this.currentTime,
        endTime: process.completionTime,
        duration: process.burstTime
      });

      this.currentTime = process.completionTime;
    });

    return this.calculateMetrics();
  }

  // Shortest Job First (SJF) - Non-preemptive
  sjf() {
    this.ganttChart = [];
    this.currentTime = 0;
    const remainingProcesses = [...this.processes];
    const completedProcesses = [];

    while (remainingProcesses.length > 0) {
      // Get processes that have arrived
      const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= this.currentTime);

      if (availableProcesses.length === 0) {
        // No process available, jump to next arrival
        const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
        this.ganttChart.push({
          processId: 'IDLE',
          startTime: this.currentTime,
          endTime: nextArrival,
          duration: nextArrival - this.currentTime
        });
        this.currentTime = nextArrival;
        continue;
      }

      // Select shortest job
      const shortestJob = availableProcesses.reduce((min, current) =>
        current.burstTime < min.burstTime ? current : min
      );

      // Execute process
      shortestJob.startTime = this.currentTime;
      shortestJob.completionTime = this.currentTime + shortestJob.burstTime;
      shortestJob.turnaroundTime = shortestJob.completionTime - shortestJob.arrivalTime;
      shortestJob.waitingTime = shortestJob.turnaroundTime - shortestJob.burstTime;

      this.ganttChart.push({
        processId: shortestJob.id,
        startTime: this.currentTime,
        endTime: shortestJob.completionTime,
        duration: shortestJob.burstTime
      });

      this.currentTime = shortestJob.completionTime;

      // Remove from remaining and add to completed
      remainingProcesses.splice(remainingProcesses.indexOf(shortestJob), 1);
      completedProcesses.push(shortestJob);
    }

    return this.calculateMetrics();
  }

  // Round Robin
  roundRobin(timeQuantum = 2) {
    this.ganttChart = [];
    this.currentTime = 0;
    const readyQueue = [];
    const processes = this.processes.map(p => ({ ...p, remainingTime: p.burstTime }));
    let processIndex = 0;

    // Add initial process to ready queue
    if (processes.length > 0) {
      readyQueue.push(processes[0]);
      processIndex = 1;
    }

    while (readyQueue.length > 0) {
      const currentProcess = readyQueue.shift();

      // Determine execution time (min of time quantum and remaining time)
      const executionTime = Math.min(timeQuantum, currentProcess.remainingTime);

      // Set start time if first execution
      if (currentProcess.startTime === -1) {
        currentProcess.startTime = this.currentTime;
      }

      // Execute process
      this.ganttChart.push({
        processId: currentProcess.id,
        startTime: this.currentTime,
        endTime: this.currentTime + executionTime,
        duration: executionTime
      });

      this.currentTime += executionTime;
      currentProcess.remainingTime -= executionTime;

      // Add newly arrived processes to ready queue
      while (processIndex < processes.length && processes[processIndex].arrivalTime <= this.currentTime) {
        readyQueue.push(processes[processIndex]);
        processIndex++;
      }

      // If process not completed, add back to ready queue
      if (currentProcess.remainingTime > 0) {
        readyQueue.push(currentProcess);
      } else {
        // Process completed
        currentProcess.completionTime = this.currentTime;
        currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
      }

      // If ready queue empty but more processes to arrive, advance time
      if (readyQueue.length === 0 && processIndex < processes.length) {
        const nextArrival = processes[processIndex].arrivalTime;
        if (nextArrival > this.currentTime) {
          this.ganttChart.push({
            processId: 'IDLE',
            startTime: this.currentTime,
            endTime: nextArrival,
            duration: nextArrival - this.currentTime
          });
          this.currentTime = nextArrival;
        }
        readyQueue.push(processes[processIndex]);
        processIndex++;
      }
    }

    return this.calculateMetrics();
  }

  // Priority Scheduling (Non-preemptive)
  priorityScheduling() {
    this.ganttChart = [];
    this.currentTime = 0;
    const remainingProcesses = [...this.processes];

    while (remainingProcesses.length > 0) {
      // Get processes that have arrived
      const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= this.currentTime);

      if (availableProcesses.length === 0) {
        // No process available, jump to next arrival
        const nextArrival = Math.min(...remainingProcesses.map(p => p.arrivalTime));
        this.ganttChart.push({
          processId: 'IDLE',
          startTime: this.currentTime,
          endTime: nextArrival,
          duration: nextArrival - this.currentTime
        });
        this.currentTime = nextArrival;
        continue;
      }

      // Select highest priority (lower number = higher priority)
      const highestPriorityProcess = availableProcesses.reduce((min, current) =>
        current.priority < min.priority ? current : min
      );

      // Execute process
      highestPriorityProcess.startTime = this.currentTime;
      highestPriorityProcess.completionTime = this.currentTime + highestPriorityProcess.burstTime;
      highestPriorityProcess.turnaroundTime = highestPriorityProcess.completionTime - highestPriorityProcess.arrivalTime;
      highestPriorityProcess.waitingTime = highestPriorityProcess.turnaroundTime - highestPriorityProcess.burstTime;

      this.ganttChart.push({
        processId: highestPriorityProcess.id,
        startTime: this.currentTime,
        endTime: highestPriorityProcess.completionTime,
        duration: highestPriorityProcess.burstTime
      });

      this.currentTime = highestPriorityProcess.completionTime;

      // Remove from remaining
      remainingProcesses.splice(remainingProcesses.indexOf(highestPriorityProcess), 1);
    }

    return this.calculateMetrics();
  }

  calculateMetrics() {
    const totalProcesses = this.processes.length;
    const totalWaitingTime = this.processes.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTurnaroundTime = this.processes.reduce((sum, p) => sum + p.turnaroundTime, 0);

    return {
      processes: this.processes.map(p => ({
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        waitingTime: p.waitingTime,
        turnaroundTime: p.turnaroundTime,
        completionTime: p.completionTime,
        startTime: p.startTime
      })),
      ganttChart: this.ganttChart,
      metrics: {
        averageWaitingTime: totalWaitingTime / totalProcesses,
        averageTurnaroundTime: totalTurnaroundTime / totalProcesses,
        totalTime: this.currentTime,
        throughput: totalProcesses / this.currentTime
      }
    };
  }
}

module.exports = { ProcessScheduler, Process };