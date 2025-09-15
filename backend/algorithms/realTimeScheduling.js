class RealTimeTask {
  constructor(id, executionTime, period, deadline = null, priority = 0) {
    this.id = id;
    this.executionTime = executionTime;
    this.period = period;
    this.deadline = deadline || period; // Deadline defaults to period
    this.priority = priority;
    this.remainingTime = executionTime;
    this.nextDeadline = deadline || period;
    this.nextRelease = 0;
    this.completedJobs = 0;
    this.missedDeadlines = 0;
    this.responseTime = 0;
    this.isActive = false;
    this.jobHistory = [];
  }

  createJob(releaseTime) {
    return {
      taskId: this.id,
      jobNumber: this.completedJobs + this.missedDeadlines + 1,
      releaseTime,
      deadline: releaseTime + this.deadline,
      executionTime: this.executionTime,
      remainingTime: this.executionTime,
      priority: this.priority,
      startTime: null,
      completionTime: null,
      responseTime: null,
      missed: false
    };
  }

  getUtilization() {
    return this.executionTime / this.period;
  }
}

class RealTimeScheduler {
  constructor() {
    this.tasks = [];
    this.readyQueue = [];
    this.runningJob = null;
    this.currentTime = 0;
    this.schedule = [];
    this.preemptions = 0;
    this.contextSwitches = 0;
    this.hyperPeriod = 0;
    this.totalUtilization = 0;
  }

  addTask(id, executionTime, period, deadline = null, priority = 0) {
    if (executionTime <= 0 || period <= 0) {
      throw new Error('Execution time and period must be positive');
    }

    if (deadline && deadline > period) {
      throw new Error('Deadline cannot be greater than period');
    }

    const task = new RealTimeTask(id, executionTime, period, deadline, priority);
    this.tasks.push(task);

    // Recalculate hyperperiod and utilization
    this.calculateHyperPeriod();
    this.calculateTotalUtilization();

    return task;
  }

  calculateHyperPeriod() {
    if (this.tasks.length === 0) {
      this.hyperPeriod = 0;
      return;
    }

    // LCM of all periods
    this.hyperPeriod = this.tasks.reduce((lcm, task) => this.lcm(lcm, task.period), 1);
  }

  calculateTotalUtilization() {
    this.totalUtilization = this.tasks.reduce((sum, task) => sum + task.getUtilization(), 0);
  }

  gcd(a, b) {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  // Rate Monotonic Scheduling (RMS)
  rateMonotonicScheduling(simulationTime = null) {
    const endTime = simulationTime || this.hyperPeriod;
    this.reset();

    // Assign priorities based on periods (shorter period = higher priority)
    this.tasks.forEach(task => {
      task.priority = 1 / task.period; // Higher value = higher priority
    });

    // Check schedulability with Rate Monotonic test
    const isSchedulable = this.rateMonotonicSchedulabilityTest();

    while (this.currentTime < endTime) {
      // Release new jobs
      this.releaseJobs();

      // Select highest priority job
      if (!this.runningJob && this.readyQueue.length > 0) {
        this.runningJob = this.getHighestPriorityJob();
        this.runningJob.startTime = this.runningJob.startTime || this.currentTime;
        this.runningJob.responseTime = this.currentTime - this.runningJob.releaseTime;
        this.contextSwitches++;
      }

      // Execute current job
      if (this.runningJob) {
        this.schedule.push({
          time: this.currentTime,
          taskId: this.runningJob.taskId,
          jobNumber: this.runningJob.jobNumber,
          remainingTime: this.runningJob.remainingTime,
          deadline: this.runningJob.deadline,
          action: 'executing'
        });

        this.runningJob.remainingTime--;

        // Job completed
        if (this.runningJob.remainingTime === 0) {
          this.runningJob.completionTime = this.currentTime + 1;
          const task = this.tasks.find(t => t.id === this.runningJob.taskId);
          task.completedJobs++;
          task.jobHistory.push({ ...this.runningJob });

          this.schedule.push({
            time: this.currentTime + 1,
            taskId: this.runningJob.taskId,
            jobNumber: this.runningJob.jobNumber,
            action: 'completed'
          });

          this.runningJob = null;
        }
      } else {
        this.schedule.push({
          time: this.currentTime,
          taskId: 'IDLE',
          action: 'idle'
        });
      }

      this.currentTime++;

      // Check for missed deadlines
      this.checkMissedDeadlines();
    }

    return {
      algorithm: 'Rate Monotonic Scheduling',
      isSchedulable,
      schedule: this.schedule,
      statistics: this.getStatistics(),
      utilizationBound: this.tasks.length * (Math.pow(2, 1/this.tasks.length) - 1)
    };
  }

  // Earliest Deadline First (EDF)
  earliestDeadlineFirst(simulationTime = null) {
    const endTime = simulationTime || this.hyperPeriod;
    this.reset();

    // Check schedulability with EDF test (utilization ≤ 1)
    const isSchedulable = this.totalUtilization <= 1.0;

    while (this.currentTime < endTime) {
      // Release new jobs
      this.releaseJobs();

      // Preemption check
      if (this.runningJob && this.readyQueue.length > 0) {
        const earliestDeadlineJob = this.getEarliestDeadlineJob();
        if (earliestDeadlineJob.deadline < this.runningJob.deadline) {
          // Preempt current job
          this.readyQueue.push(this.runningJob);
          this.runningJob = earliestDeadlineJob;
          this.preemptions++;
          this.contextSwitches++;
        }
      }

      // Select job with earliest deadline
      if (!this.runningJob && this.readyQueue.length > 0) {
        this.runningJob = this.getEarliestDeadlineJob();
        this.runningJob.startTime = this.runningJob.startTime || this.currentTime;
        this.runningJob.responseTime = this.currentTime - this.runningJob.releaseTime;
        this.contextSwitches++;
      }

      // Execute current job
      if (this.runningJob) {
        this.schedule.push({
          time: this.currentTime,
          taskId: this.runningJob.taskId,
          jobNumber: this.runningJob.jobNumber,
          remainingTime: this.runningJob.remainingTime,
          deadline: this.runningJob.deadline,
          action: 'executing'
        });

        this.runningJob.remainingTime--;

        // Job completed
        if (this.runningJob.remainingTime === 0) {
          this.runningJob.completionTime = this.currentTime + 1;
          const task = this.tasks.find(t => t.id === this.runningJob.taskId);
          task.completedJobs++;
          task.jobHistory.push({ ...this.runningJob });

          this.schedule.push({
            time: this.currentTime + 1,
            taskId: this.runningJob.taskId,
            jobNumber: this.runningJob.jobNumber,
            action: 'completed'
          });

          this.runningJob = null;
        }
      } else {
        this.schedule.push({
          time: this.currentTime,
          taskId: 'IDLE',
          action: 'idle'
        });
      }

      this.currentTime++;

      // Check for missed deadlines
      this.checkMissedDeadlines();
    }

    return {
      algorithm: 'Earliest Deadline First',
      isSchedulable,
      schedule: this.schedule,
      statistics: this.getStatistics()
    };
  }

  // Deadline Monotonic Scheduling (DMS)
  deadlineMonotonicScheduling(simulationTime = null) {
    const endTime = simulationTime || this.hyperPeriod;
    this.reset();

    // Assign priorities based on deadlines (shorter deadline = higher priority)
    this.tasks.forEach(task => {
      task.priority = 1 / task.deadline;
    });

    while (this.currentTime < endTime) {
      // Release new jobs
      this.releaseJobs();

      // Select highest priority job (shortest deadline)
      if (!this.runningJob && this.readyQueue.length > 0) {
        this.runningJob = this.getHighestPriorityJob();
        this.runningJob.startTime = this.runningJob.startTime || this.currentTime;
        this.runningJob.responseTime = this.currentTime - this.runningJob.releaseTime;
        this.contextSwitches++;
      }

      // Execute current job
      if (this.runningJob) {
        this.schedule.push({
          time: this.currentTime,
          taskId: this.runningJob.taskId,
          jobNumber: this.runningJob.jobNumber,
          remainingTime: this.runningJob.remainingTime,
          deadline: this.runningJob.deadline,
          action: 'executing'
        });

        this.runningJob.remainingTime--;

        // Job completed
        if (this.runningJob.remainingTime === 0) {
          this.runningJob.completionTime = this.currentTime + 1;
          const task = this.tasks.find(t => t.id === this.runningJob.taskId);
          task.completedJobs++;
          task.jobHistory.push({ ...this.runningJob });

          this.runningJob = null;
        }
      } else {
        this.schedule.push({
          time: this.currentTime,
          taskId: 'IDLE',
          action: 'idle'
        });
      }

      this.currentTime++;
      this.checkMissedDeadlines();
    }

    return {
      algorithm: 'Deadline Monotonic Scheduling',
      schedule: this.schedule,
      statistics: this.getStatistics()
    };
  }

  // Least Slack Time First (LST)
  leastSlackTimeFirst(simulationTime = null) {
    const endTime = simulationTime || this.hyperPeriod;
    this.reset();

    while (this.currentTime < endTime) {
      // Release new jobs
      this.releaseJobs();

      // Calculate slack times and preemption check
      this.readyQueue.forEach(job => {
        job.slackTime = job.deadline - this.currentTime - job.remainingTime;
      });

      if (this.runningJob) {
        this.runningJob.slackTime = this.runningJob.deadline - this.currentTime - this.runningJob.remainingTime;
      }

      // Preemption check
      if (this.runningJob && this.readyQueue.length > 0) {
        const leastSlackJob = this.getLeastSlackJob();
        if (leastSlackJob.slackTime < this.runningJob.slackTime) {
          this.readyQueue.push(this.runningJob);
          this.runningJob = leastSlackJob;
          this.preemptions++;
          this.contextSwitches++;
        }
      }

      // Select job with least slack time
      if (!this.runningJob && this.readyQueue.length > 0) {
        this.runningJob = this.getLeastSlackJob();
        this.runningJob.startTime = this.runningJob.startTime || this.currentTime;
        this.runningJob.responseTime = this.currentTime - this.runningJob.releaseTime;
        this.contextSwitches++;
      }

      // Execute current job
      if (this.runningJob) {
        this.schedule.push({
          time: this.currentTime,
          taskId: this.runningJob.taskId,
          jobNumber: this.runningJob.jobNumber,
          remainingTime: this.runningJob.remainingTime,
          deadline: this.runningJob.deadline,
          slackTime: this.runningJob.slackTime,
          action: 'executing'
        });

        this.runningJob.remainingTime--;

        // Job completed
        if (this.runningJob.remainingTime === 0) {
          this.runningJob.completionTime = this.currentTime + 1;
          const task = this.tasks.find(t => t.id === this.runningJob.taskId);
          task.completedJobs++;
          task.jobHistory.push({ ...this.runningJob });

          this.runningJob = null;
        }
      } else {
        this.schedule.push({
          time: this.currentTime,
          taskId: 'IDLE',
          action: 'idle'
        });
      }

      this.currentTime++;
      this.checkMissedDeadlines();
    }

    return {
      algorithm: 'Least Slack Time First',
      schedule: this.schedule,
      statistics: this.getStatistics()
    };
  }

  // Helper methods
  releaseJobs() {
    this.tasks.forEach(task => {
      if (this.currentTime % task.period === 0) {
        const job = task.createJob(this.currentTime);
        this.readyQueue.push(job);
      }
    });
  }

  getHighestPriorityJob() {
    const job = this.readyQueue.reduce((highest, current) =>
      current.priority > highest.priority ? current : highest
    );
    this.readyQueue = this.readyQueue.filter(j => j !== job);
    return job;
  }

  getEarliestDeadlineJob() {
    const job = this.readyQueue.reduce((earliest, current) =>
      current.deadline < earliest.deadline ? current : earliest
    );
    this.readyQueue = this.readyQueue.filter(j => j !== job);
    return job;
  }

  getLeastSlackJob() {
    const job = this.readyQueue.reduce((leastSlack, current) =>
      current.slackTime < leastSlack.slackTime ? current : leastSlack
    );
    this.readyQueue = this.readyQueue.filter(j => j !== job);
    return job;
  }

  checkMissedDeadlines() {
    const missedJobs = this.readyQueue.filter(job => this.currentTime >= job.deadline);

    missedJobs.forEach(job => {
      job.missed = true;
      const task = this.tasks.find(t => t.id === job.taskId);
      task.missedDeadlines++;
      task.jobHistory.push({ ...job });

      this.schedule.push({
        time: this.currentTime,
        taskId: job.taskId,
        jobNumber: job.jobNumber,
        action: 'deadline_missed'
      });
    });

    this.readyQueue = this.readyQueue.filter(job => this.currentTime < job.deadline);

    // Check running job
    if (this.runningJob && this.currentTime >= this.runningJob.deadline) {
      this.runningJob.missed = true;
      const task = this.tasks.find(t => t.id === this.runningJob.taskId);
      task.missedDeadlines++;
      task.jobHistory.push({ ...this.runningJob });

      this.schedule.push({
        time: this.currentTime,
        taskId: this.runningJob.taskId,
        jobNumber: this.runningJob.jobNumber,
        action: 'deadline_missed'
      });

      this.runningJob = null;
    }
  }

  rateMonotonicSchedulabilityTest() {
    // Rate Monotonic Utilization Bound Test
    const n = this.tasks.length;
    const utilizationBound = n * (Math.pow(2, 1/n) - 1);
    return this.totalUtilization <= utilizationBound;
  }

  getStatistics() {
    const totalJobs = this.tasks.reduce((sum, task) => sum + task.completedJobs + task.missedDeadlines, 0);
    const totalMissed = this.tasks.reduce((sum, task) => sum + task.missedDeadlines, 0);
    const totalCompleted = this.tasks.reduce((sum, task) => sum + task.completedJobs, 0);

    const taskStats = this.tasks.map(task => ({
      taskId: task.id,
      period: task.period,
      executionTime: task.executionTime,
      deadline: task.deadline,
      utilization: task.getUtilization(),
      completedJobs: task.completedJobs,
      missedDeadlines: task.missedDeadlines,
      successRate: task.completedJobs / (task.completedJobs + task.missedDeadlines) * 100,
      averageResponseTime: task.jobHistory.length > 0 ?
        task.jobHistory.reduce((sum, job) => sum + (job.responseTime || 0), 0) / task.jobHistory.length : 0
    }));

    return {
      totalUtilization: this.totalUtilization,
      hyperPeriod: this.hyperPeriod,
      simulationTime: this.currentTime,
      totalJobs,
      completedJobs: totalCompleted,
      missedDeadlines: totalMissed,
      successRate: totalJobs > 0 ? (totalCompleted / totalJobs) * 100 : 0,
      preemptions: this.preemptions,
      contextSwitches: this.contextSwitches,
      cpuUtilization: this.schedule.filter(entry => entry.action === 'executing').length / this.currentTime * 100,
      taskStatistics: taskStats
    };
  }

  reset() {
    this.readyQueue = [];
    this.runningJob = null;
    this.currentTime = 0;
    this.schedule = [];
    this.preemptions = 0;
    this.contextSwitches = 0;

    this.tasks.forEach(task => {
      task.completedJobs = 0;
      task.missedDeadlines = 0;
      task.jobHistory = [];
    });
  }

  getSystemState() {
    return {
      tasks: this.tasks.map(task => ({
        id: task.id,
        executionTime: task.executionTime,
        period: task.period,
        deadline: task.deadline,
        priority: task.priority,
        utilization: task.getUtilization(),
        completedJobs: task.completedJobs,
        missedDeadlines: task.missedDeadlines
      })),
      totalUtilization: this.totalUtilization,
      hyperPeriod: this.hyperPeriod,
      readyQueueSize: this.readyQueue.length,
      runningJob: this.runningJob,
      currentTime: this.currentTime
    };
  }

  // Predefined task sets for demonstration
  createPeriodicTaskSet() {
    this.tasks = [];
    this.addTask('T1', 3, 10, 10, 0);
    this.addTask('T2', 2, 15, 15, 0);
    this.addTask('T3', 1, 20, 20, 0);
  }

  createHardRealTimeTaskSet() {
    this.tasks = [];
    this.addTask('T1', 2, 5, 5, 0);    // High frequency
    this.addTask('T2', 3, 10, 8, 0);   // Deadline < Period
    this.addTask('T3', 4, 15, 12, 0);  // Deadline < Period
  }
}

module.exports = { RealTimeScheduler, RealTimeTask };