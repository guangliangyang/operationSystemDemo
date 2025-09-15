class IORequest {
  constructor(processId, deviceId, operation, arrivalTime = Date.now()) {
    this.processId = processId;
    this.deviceId = deviceId;
    this.operation = operation; // 'read' or 'write'
    this.arrivalTime = arrivalTime;
    this.startTime = null;
    this.completionTime = null;
    this.waitTime = null;
    this.serviceTime = null;
    this.status = 'waiting'; // 'waiting', 'processing', 'completed'
  }
}

class Device {
  constructor(deviceId, name, serviceTime = 5) {
    this.deviceId = deviceId;
    this.name = name;
    this.serviceTime = serviceTime; // Time units to complete an operation
    this.isIdle = true;
    this.currentRequest = null;
    this.requestQueue = [];
    this.completedRequests = [];
    this.totalBusyTime = 0;
    this.utilizationPercentage = 0;
  }

  addRequest(request) {
    this.requestQueue.push(request);
  }

  processNextRequest(currentTime) {
    if (this.isIdle && this.requestQueue.length > 0) {
      this.currentRequest = this.requestQueue.shift();
      this.currentRequest.startTime = currentTime;
      this.currentRequest.status = 'processing';
      this.currentRequest.waitTime = currentTime - this.currentRequest.arrivalTime;
      this.isIdle = false;
      return this.currentRequest;
    }
    return null;
  }

  completeCurrentRequest(currentTime) {
    if (this.currentRequest) {
      this.currentRequest.completionTime = currentTime;
      this.currentRequest.serviceTime = currentTime - this.currentRequest.startTime;
      this.currentRequest.status = 'completed';
      this.completedRequests.push(this.currentRequest);
      this.totalBusyTime += this.currentRequest.serviceTime;

      const completedRequest = this.currentRequest;
      this.currentRequest = null;
      this.isIdle = true;
      return completedRequest;
    }
    return null;
  }
}

class Buffer {
  constructor(size = 5) {
    this.size = size;
    this.data = [];
    this.readPointer = 0;
    this.writePointer = 0;
    this.count = 0;
  }

  isFull() {
    return this.count === this.size;
  }

  isEmpty() {
    return this.count === 0;
  }

  write(data) {
    if (this.isFull()) {
      return false; // Buffer overflow
    }

    this.data[this.writePointer] = data;
    this.writePointer = (this.writePointer + 1) % this.size;
    this.count++;
    return true;
  }

  read() {
    if (this.isEmpty()) {
      return null; // Buffer underflow
    }

    const data = this.data[this.readPointer];
    this.data[this.readPointer] = null;
    this.readPointer = (this.readPointer + 1) % this.size;
    this.count--;
    return data;
  }

  getState() {
    return {
      size: this.size,
      count: this.count,
      data: [...this.data],
      readPointer: this.readPointer,
      writePointer: this.writePointer,
      isFull: this.isFull(),
      isEmpty: this.isEmpty()
    };
  }
}

class IOManager {
  constructor() {
    this.devices = new Map();
    this.requests = [];
    this.currentTime = 0;
    this.simulationHistory = [];
    this.buffers = new Map();
    this.interrupts = [];
    this.statistics = {
      totalRequests: 0,
      completedRequests: 0,
      totalWaitTime: 0,
      totalServiceTime: 0
    };
  }

  reset() {
    this.devices.clear();
    this.requests = [];
    this.currentTime = 0;
    this.simulationHistory = [];
    this.buffers.clear();
    this.interrupts = [];
    this.statistics = {
      totalRequests: 0,
      completedRequests: 0,
      totalWaitTime: 0,
      totalServiceTime: 0
    };
  }

  addDevice(deviceId, name, serviceTime = 5) {
    this.devices.set(deviceId, new Device(deviceId, name, serviceTime));
  }

  addBuffer(bufferId, size = 5) {
    this.buffers.set(bufferId, new Buffer(size));
  }

  addIORequest(processId, deviceId, operation = 'read') {
    if (!this.devices.has(deviceId)) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const request = new IORequest(processId, deviceId, operation, this.currentTime);
    this.requests.push(request);
    this.devices.get(deviceId).addRequest(request);
    this.statistics.totalRequests++;

    this.simulationHistory.push({
      time: this.currentTime,
      event: 'request_arrival',
      processId,
      deviceId,
      operation,
      details: `Process ${processId} requests ${operation} on device ${deviceId}`
    });

    return request;
  }

  // Simulate FCFS I/O scheduling
  simulateFCFS(timeLimit = 50) {
    this.currentTime = 0;
    this.simulationHistory = [];

    while (this.currentTime < timeLimit) {
      let anyActivity = false;

      // Process devices
      for (const [deviceId, device] of this.devices) {
        // Check if current request is completed
        if (!device.isIdle && device.currentRequest) {
          const requestDuration = this.currentTime - device.currentRequest.startTime;
          if (requestDuration >= device.serviceTime) {
            const completedRequest = device.completeCurrentRequest(this.currentTime);
            this.statistics.completedRequests++;
            this.statistics.totalWaitTime += completedRequest.waitTime;
            this.statistics.totalServiceTime += completedRequest.serviceTime;

            // Generate interrupt
            this.interrupts.push({
              time: this.currentTime,
              type: 'io_completion',
              deviceId,
              processId: completedRequest.processId,
              operation: completedRequest.operation
            });

            this.simulationHistory.push({
              time: this.currentTime,
              event: 'request_completed',
              processId: completedRequest.processId,
              deviceId,
              operation: completedRequest.operation,
              waitTime: completedRequest.waitTime,
              serviceTime: completedRequest.serviceTime,
              details: `Process ${completedRequest.processId} completed ${completedRequest.operation} on device ${deviceId}`
            });

            anyActivity = true;
          }
        }

        // Start next request if device is idle
        if (device.isIdle && device.requestQueue.length > 0) {
          const startedRequest = device.processNextRequest(this.currentTime);
          if (startedRequest) {
            this.simulationHistory.push({
              time: this.currentTime,
              event: 'request_started',
              processId: startedRequest.processId,
              deviceId,
              operation: startedRequest.operation,
              waitTime: startedRequest.waitTime,
              details: `Process ${startedRequest.processId} started ${startedRequest.operation} on device ${deviceId}`
            });

            anyActivity = true;
          }
        }
      }

      // Update device utilization
      for (const device of this.devices.values()) {
        if (!device.isIdle) {
          device.utilizationPercentage = (device.totalBusyTime / (this.currentTime + 1)) * 100;
        }
      }

      if (!anyActivity && this.getAllPendingRequests().length === 0) {
        break; // No more requests to process
      }

      this.currentTime++;
    }

    return this.getSimulationResults();
  }

  // Simulate Shortest Job First I/O scheduling
  simulateSJF(timeLimit = 50) {
    this.currentTime = 0;
    this.simulationHistory = [];

    while (this.currentTime < timeLimit) {
      let anyActivity = false;

      // Process devices
      for (const [deviceId, device] of this.devices) {
        // Check if current request is completed
        if (!device.isIdle && device.currentRequest) {
          const requestDuration = this.currentTime - device.currentRequest.startTime;
          if (requestDuration >= device.serviceTime) {
            const completedRequest = device.completeCurrentRequest(this.currentTime);
            this.statistics.completedRequests++;
            this.statistics.totalWaitTime += completedRequest.waitTime;
            this.statistics.totalServiceTime += completedRequest.serviceTime;

            this.simulationHistory.push({
              time: this.currentTime,
              event: 'request_completed',
              processId: completedRequest.processId,
              deviceId,
              operation: completedRequest.operation,
              waitTime: completedRequest.waitTime,
              serviceTime: completedRequest.serviceTime,
              details: `Process ${completedRequest.processId} completed ${completedRequest.operation} on device ${deviceId}`
            });

            anyActivity = true;
          }
        }

        // Start next request if device is idle (SJF: shortest service time first)
        if (device.isIdle && device.requestQueue.length > 0) {
          // Sort queue by service time (SJF)
          device.requestQueue.sort((a, b) => {
            // For simplicity, assume read operations are faster than write
            const aTime = a.operation === 'read' ? device.serviceTime * 0.8 : device.serviceTime;
            const bTime = b.operation === 'read' ? device.serviceTime * 0.8 : device.serviceTime;
            return aTime - bTime;
          });

          const startedRequest = device.processNextRequest(this.currentTime);
          if (startedRequest) {
            this.simulationHistory.push({
              time: this.currentTime,
              event: 'request_started',
              processId: startedRequest.processId,
              deviceId,
              operation: startedRequest.operation,
              waitTime: startedRequest.waitTime,
              details: `Process ${startedRequest.processId} started ${startedRequest.operation} on device ${deviceId} (SJF)`
            });

            anyActivity = true;
          }
        }
      }

      if (!anyActivity && this.getAllPendingRequests().length === 0) {
        break;
      }

      this.currentTime++;
    }

    return this.getSimulationResults();
  }

  // Buffer operations simulation
  simulateBuffering(producerRate = 2, consumerRate = 3, timeLimit = 20) {
    if (!this.buffers.has('main')) {
      this.addBuffer('main', 5);
    }

    const buffer = this.buffers.get('main');
    const history = [];
    let producerCounter = 0;
    let consumerCounter = 0;
    let produced = 0;
    let consumed = 0;

    for (let time = 0; time < timeLimit; time++) {
      // Producer
      if (time % producerRate === 0) {
        const data = `Data-${++producerCounter}`;
        if (buffer.write(data)) {
          produced++;
          history.push({
            time,
            event: 'produce',
            data,
            bufferState: buffer.getState(),
            success: true
          });
        } else {
          history.push({
            time,
            event: 'produce',
            data,
            bufferState: buffer.getState(),
            success: false,
            reason: 'Buffer full'
          });
        }
      }

      // Consumer
      if (time % consumerRate === 0 && time > 0) {
        const data = buffer.read();
        if (data) {
          consumed++;
          history.push({
            time,
            event: 'consume',
            data,
            bufferState: buffer.getState(),
            success: true
          });
        } else {
          history.push({
            time,
            event: 'consume',
            data: null,
            bufferState: buffer.getState(),
            success: false,
            reason: 'Buffer empty'
          });
        }
      }
    }

    return {
      algorithm: 'Buffering Simulation',
      timeLimit,
      producerRate,
      consumerRate,
      totalProduced: produced,
      totalConsumed: consumed,
      finalBufferState: buffer.getState(),
      history,
      efficiency: (consumed / produced) * 100 || 0
    };
  }

  getAllPendingRequests() {
    const pending = [];
    for (const device of this.devices.values()) {
      pending.push(...device.requestQueue);
      if (device.currentRequest) {
        pending.push(device.currentRequest);
      }
    }
    return pending;
  }

  getSimulationResults() {
    const completedRequests = [];
    for (const device of this.devices.values()) {
      completedRequests.push(...device.completedRequests);
    }

    const avgWaitTime = this.statistics.completedRequests > 0 ?
      this.statistics.totalWaitTime / this.statistics.completedRequests : 0;

    const avgServiceTime = this.statistics.completedRequests > 0 ?
      this.statistics.totalServiceTime / this.statistics.completedRequests : 0;

    return {
      statistics: {
        totalRequests: this.statistics.totalRequests,
        completedRequests: this.statistics.completedRequests,
        pendingRequests: this.statistics.totalRequests - this.statistics.completedRequests,
        averageWaitTime: avgWaitTime,
        averageServiceTime: avgServiceTime,
        totalSimulationTime: this.currentTime
      },
      devices: Array.from(this.devices.values()).map(device => ({
        deviceId: device.deviceId,
        name: device.name,
        isIdle: device.isIdle,
        queueLength: device.requestQueue.length,
        completedRequests: device.completedRequests.length,
        utilizationPercentage: device.utilizationPercentage,
        totalBusyTime: device.totalBusyTime
      })),
      completedRequests: completedRequests.map(req => ({
        processId: req.processId,
        deviceId: req.deviceId,
        operation: req.operation,
        waitTime: req.waitTime,
        serviceTime: req.serviceTime,
        arrivalTime: req.arrivalTime,
        completionTime: req.completionTime
      })),
      simulationHistory: this.simulationHistory,
      interrupts: this.interrupts
    };
  }

  getSystemState() {
    return {
      currentTime: this.currentTime,
      devices: Array.from(this.devices.values()).map(device => ({
        deviceId: device.deviceId,
        name: device.name,
        isIdle: device.isIdle,
        queueLength: device.requestQueue.length,
        currentRequest: device.currentRequest ? {
          processId: device.currentRequest.processId,
          operation: device.currentRequest.operation,
          progress: device.currentRequest.startTime ? this.currentTime - device.currentRequest.startTime : 0
        } : null
      })),
      buffers: Array.from(this.buffers.entries()).map(([id, buffer]) => ({
        bufferId: id,
        ...buffer.getState()
      })),
      statistics: this.statistics
    };
  }
}

module.exports = { IOManager, IORequest, Device, Buffer };