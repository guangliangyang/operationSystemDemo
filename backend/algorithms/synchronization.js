class Semaphore {
  constructor(value = 1, name = 'semaphore') {
    this.value = value;
    this.name = name;
    this.waitingQueue = [];
    this.history = [];
    this.currentTime = 0;
  }

  wait(processId) {
    this.currentTime++;

    if (this.value > 0) {
      this.value--;
      this.history.push({
        time: this.currentTime,
        operation: 'wait',
        processId,
        success: true,
        semaphoreValue: this.value,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} acquired semaphore ${this.name}`
      });
      return { success: true, acquired: true };
    } else {
      this.waitingQueue.push({
        processId,
        arrivalTime: this.currentTime
      });

      this.history.push({
        time: this.currentTime,
        operation: 'wait',
        processId,
        success: false,
        semaphoreValue: this.value,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} blocked, added to waiting queue`
      });

      return { success: true, acquired: false, blocked: true };
    }
  }

  signal(processId) {
    this.currentTime++;

    if (this.waitingQueue.length > 0) {
      const waitingProcess = this.waitingQueue.shift();
      const waitTime = this.currentTime - waitingProcess.arrivalTime;

      this.history.push({
        time: this.currentTime,
        operation: 'signal',
        processId,
        releasedProcess: waitingProcess.processId,
        waitTime,
        semaphoreValue: this.value,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} released semaphore, process ${waitingProcess.processId} unblocked (waited ${waitTime} time units)`
      });

      return {
        success: true,
        unblocked: waitingProcess.processId,
        waitTime
      };
    } else {
      this.value++;

      this.history.push({
        time: this.currentTime,
        operation: 'signal',
        processId,
        semaphoreValue: this.value,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} released semaphore ${this.name}, value increased to ${this.value}`
      });

      return { success: true, valueIncreased: true };
    }
  }

  getState() {
    return {
      name: this.name,
      value: this.value,
      waitingQueue: [...this.waitingQueue],
      queueLength: this.waitingQueue.length,
      currentTime: this.currentTime
    };
  }

  reset() {
    const initialValue = this.value + this.waitingQueue.length;
    this.value = initialValue;
    this.waitingQueue = [];
    this.history = [];
    this.currentTime = 0;
  }
}

class Mutex {
  constructor(name = 'mutex') {
    this.name = name;
    this.isLocked = false;
    this.owner = null;
    this.waitingQueue = [];
    this.history = [];
    this.currentTime = 0;
  }

  lock(processId) {
    this.currentTime++;

    if (!this.isLocked) {
      this.isLocked = true;
      this.owner = processId;

      this.history.push({
        time: this.currentTime,
        operation: 'lock',
        processId,
        success: true,
        owner: this.owner,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} acquired mutex ${this.name}`
      });

      return { success: true, acquired: true };
    } else {
      this.waitingQueue.push({
        processId,
        arrivalTime: this.currentTime
      });

      this.history.push({
        time: this.currentTime,
        operation: 'lock',
        processId,
        success: false,
        owner: this.owner,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} blocked on mutex ${this.name} (owned by ${this.owner})`
      });

      return { success: true, acquired: false, blocked: true };
    }
  }

  unlock(processId) {
    this.currentTime++;

    if (this.owner !== processId) {
      this.history.push({
        time: this.currentTime,
        operation: 'unlock',
        processId,
        success: false,
        owner: this.owner,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} cannot unlock mutex ${this.name} (not owner, owned by ${this.owner})`
      });

      return { success: false, error: 'Not the owner of mutex' };
    }

    if (this.waitingQueue.length > 0) {
      const waitingProcess = this.waitingQueue.shift();
      const waitTime = this.currentTime - waitingProcess.arrivalTime;
      this.owner = waitingProcess.processId;

      this.history.push({
        time: this.currentTime,
        operation: 'unlock',
        processId,
        newOwner: waitingProcess.processId,
        waitTime,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} released mutex, process ${waitingProcess.processId} now owns it (waited ${waitTime} time units)`
      });

      return {
        success: true,
        newOwner: waitingProcess.processId,
        waitTime
      };
    } else {
      this.isLocked = false;
      this.owner = null;

      this.history.push({
        time: this.currentTime,
        operation: 'unlock',
        processId,
        queueLength: this.waitingQueue.length,
        message: `Process ${processId} released mutex ${this.name}, now available`
      });

      return { success: true, released: true };
    }
  }

  getState() {
    return {
      name: this.name,
      isLocked: this.isLocked,
      owner: this.owner,
      waitingQueue: [...this.waitingQueue],
      queueLength: this.waitingQueue.length,
      currentTime: this.currentTime
    };
  }

  reset() {
    this.isLocked = false;
    this.owner = null;
    this.waitingQueue = [];
    this.history = [];
    this.currentTime = 0;
  }
}

class Monitor {
  constructor(name = 'monitor') {
    this.name = name;
    this.mutex = new Mutex(`${name}_mutex`);
    this.conditionVariables = new Map();
    this.activeProcess = null;
    this.history = [];
    this.currentTime = 0;
  }

  enter(processId) {
    this.currentTime++;
    const result = this.mutex.lock(processId);

    if (result.acquired) {
      this.activeProcess = processId;
      this.history.push({
        time: this.currentTime,
        operation: 'enter',
        processId,
        success: true,
        message: `Process ${processId} entered monitor ${this.name}`
      });
    } else {
      this.history.push({
        time: this.currentTime,
        operation: 'enter',
        processId,
        success: false,
        message: `Process ${processId} blocked trying to enter monitor ${this.name}`
      });
    }

    return result;
  }

  exit(processId) {
    this.currentTime++;

    if (this.activeProcess !== processId) {
      this.history.push({
        time: this.currentTime,
        operation: 'exit',
        processId,
        success: false,
        message: `Process ${processId} cannot exit monitor ${this.name} (not active process)`
      });
      return { success: false, error: 'Not the active process' };
    }

    const result = this.mutex.unlock(processId);

    if (result.success) {
      this.activeProcess = result.newOwner || null;
      this.history.push({
        time: this.currentTime,
        operation: 'exit',
        processId,
        newActiveProcess: this.activeProcess,
        success: true,
        message: `Process ${processId} exited monitor ${this.name}${this.activeProcess ? `, process ${this.activeProcess} now active` : ''}`
      });
    }

    return result;
  }

  wait(processId, conditionName) {
    this.currentTime++;

    if (this.activeProcess !== processId) {
      return { success: false, error: 'Not the active process' };
    }

    if (!this.conditionVariables.has(conditionName)) {
      this.conditionVariables.set(conditionName, []);
    }

    const conditionQueue = this.conditionVariables.get(conditionName);
    conditionQueue.push({
      processId,
      waitTime: this.currentTime
    });

    // Release mutex and allow another process to enter
    const unlockResult = this.mutex.unlock(processId);
    this.activeProcess = unlockResult.newOwner || null;

    this.history.push({
      time: this.currentTime,
      operation: 'wait',
      processId,
      conditionName,
      newActiveProcess: this.activeProcess,
      success: true,
      message: `Process ${processId} waiting on condition ${conditionName}, released monitor`
    });

    return { success: true, waiting: true };
  }

  signal(processId, conditionName) {
    this.currentTime++;

    if (this.activeProcess !== processId) {
      return { success: false, error: 'Not the active process' };
    }

    if (!this.conditionVariables.has(conditionName)) {
      this.history.push({
        time: this.currentTime,
        operation: 'signal',
        processId,
        conditionName,
        success: true,
        message: `Process ${processId} signaled condition ${conditionName}, but no processes waiting`
      });
      return { success: true, noWaitingProcesses: true };
    }

    const conditionQueue = this.conditionVariables.get(conditionName);

    if (conditionQueue.length === 0) {
      this.history.push({
        time: this.currentTime,
        operation: 'signal',
        processId,
        conditionName,
        success: true,
        message: `Process ${processId} signaled condition ${conditionName}, but no processes waiting`
      });
      return { success: true, noWaitingProcesses: true };
    }

    const waitingProcess = conditionQueue.shift();
    const totalWaitTime = this.currentTime - waitingProcess.waitTime;

    this.history.push({
      time: this.currentTime,
      operation: 'signal',
      processId,
      conditionName,
      signaledProcess: waitingProcess.processId,
      waitTime: totalWaitTime,
      success: true,
      message: `Process ${processId} signaled condition ${conditionName}, process ${waitingProcess.processId} unblocked (waited ${totalWaitTime} time units)`
    });

    return {
      success: true,
      signaledProcess: waitingProcess.processId,
      waitTime: totalWaitTime
    };
  }

  getState() {
    const conditions = {};
    for (const [name, queue] of this.conditionVariables) {
      conditions[name] = [...queue];
    }

    return {
      name: this.name,
      activeProcess: this.activeProcess,
      mutex: this.mutex.getState(),
      conditionVariables: conditions,
      currentTime: this.currentTime
    };
  }

  reset() {
    this.mutex.reset();
    this.conditionVariables.clear();
    this.activeProcess = null;
    this.history = [];
    this.currentTime = 0;
  }
}

class SynchronizationManager {
  constructor() {
    this.semaphores = new Map();
    this.mutexes = new Map();
    this.monitors = new Map();
    this.globalHistory = [];
  }

  createSemaphore(name, initialValue = 1) {
    const semaphore = new Semaphore(initialValue, name);
    this.semaphores.set(name, semaphore);

    this.globalHistory.push({
      time: Date.now(),
      operation: 'create_semaphore',
      name,
      initialValue,
      message: `Created semaphore ${name} with initial value ${initialValue}`
    });

    return semaphore;
  }

  createMutex(name) {
    const mutex = new Mutex(name);
    this.mutexes.set(name, mutex);

    this.globalHistory.push({
      time: Date.now(),
      operation: 'create_mutex',
      name,
      message: `Created mutex ${name}`
    });

    return mutex;
  }

  createMonitor(name) {
    const monitor = new Monitor(name);
    this.monitors.set(name, monitor);

    this.globalHistory.push({
      time: Date.now(),
      operation: 'create_monitor',
      name,
      message: `Created monitor ${name}`
    });

    return monitor;
  }

  getSemaphore(name) {
    return this.semaphores.get(name);
  }

  getMutex(name) {
    return this.mutexes.get(name);
  }

  getMonitor(name) {
    return this.monitors.get(name);
  }

  getAllStates() {
    const semaphoreStates = {};
    const mutexStates = {};
    const monitorStates = {};

    for (const [name, semaphore] of this.semaphores) {
      semaphoreStates[name] = {
        ...semaphore.getState(),
        history: semaphore.history
      };
    }

    for (const [name, mutex] of this.mutexes) {
      mutexStates[name] = {
        ...mutex.getState(),
        history: mutex.history
      };
    }

    for (const [name, monitor] of this.monitors) {
      monitorStates[name] = {
        ...monitor.getState(),
        history: monitor.history
      };
    }

    return {
      semaphores: semaphoreStates,
      mutexes: mutexStates,
      monitors: monitorStates,
      globalHistory: this.globalHistory
    };
  }

  reset() {
    this.semaphores.clear();
    this.mutexes.clear();
    this.monitors.clear();
    this.globalHistory = [];
  }

  // Producer-Consumer simulation using semaphores
  simulateProducerConsumer(bufferSize = 5, producers = 2, consumers = 2, timeLimit = 20) {
    this.reset();

    // Create semaphores for producer-consumer
    const empty = this.createSemaphore('empty', bufferSize);
    const full = this.createSemaphore('full', 0);
    const mutex = this.createMutex('buffer_mutex');

    const simulation = [];
    const buffer = [];
    let itemCounter = 0;

    // Simulate producer-consumer operations
    for (let time = 0; time < timeLimit; time++) {
      // Producer operations
      for (let p = 0; p < producers; p++) {
        if (Math.random() < 0.3) { // 30% chance to produce
          const processId = `Producer${p + 1}`;

          // Try to acquire empty slot
          const emptyResult = empty.wait(processId);
          if (emptyResult.acquired) {
            // Acquire mutex
            const mutexResult = mutex.lock(processId);
            if (mutexResult.acquired) {
              // Produce item
              const item = `Item${++itemCounter}`;
              buffer.push(item);

              simulation.push({
                time,
                processId,
                operation: 'produce',
                item,
                bufferSize: buffer.length,
                message: `${processId} produced ${item}, buffer size: ${buffer.length}`
              });

              // Release mutex and signal full
              mutex.unlock(processId);
              full.signal(processId);
            }
          }
        }
      }

      // Consumer operations
      for (let c = 0; c < consumers; c++) {
        if (Math.random() < 0.3) { // 30% chance to consume
          const processId = `Consumer${c + 1}`;

          // Try to acquire full slot
          const fullResult = full.wait(processId);
          if (fullResult.acquired) {
            // Acquire mutex
            const mutexResult = mutex.lock(processId);
            if (mutexResult.acquired) {
              // Consume item
              const item = buffer.shift();

              simulation.push({
                time,
                processId,
                operation: 'consume',
                item,
                bufferSize: buffer.length,
                message: `${processId} consumed ${item}, buffer size: ${buffer.length}`
              });

              // Release mutex and signal empty
              mutex.unlock(processId);
              empty.signal(processId);
            }
          }
        }
      }
    }

    return {
      simulation,
      finalState: this.getAllStates(),
      bufferSize,
      producers,
      consumers,
      timeLimit,
      finalBufferContents: buffer
    };
  }
}

module.exports = {
  SynchronizationManager,
  Semaphore,
  Mutex,
  Monitor
};