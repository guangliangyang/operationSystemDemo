class DiskRequest {
  constructor(trackNumber, processId, timestamp = Date.now()) {
    this.trackNumber = trackNumber;
    this.processId = processId;
    this.timestamp = timestamp;
    this.serviceTime = null;
    this.waitTime = null;
  }
}

class DiskScheduler {
  constructor(totalTracks = 200, currentHead = 100) {
    this.totalTracks = totalTracks;
    this.currentHead = currentHead;
    this.initialHead = currentHead;
    this.requests = [];
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    this.currentTime = 0;
  }

  reset() {
    this.currentHead = this.initialHead;
    this.requests = [];
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    this.currentTime = 0;
  }

  addRequest(trackNumber, processId) {
    if (trackNumber < 0 || trackNumber >= this.totalTracks) {
      throw new Error(`Track number must be between 0 and ${this.totalTracks - 1}`);
    }
    this.requests.push(new DiskRequest(trackNumber, processId));
  }

  // First Come First Serve (FCFS)
  fcfs() {
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    let currentHead = this.currentHead;

    const orderedRequests = [...this.requests].sort((a, b) => a.timestamp - b.timestamp);

    orderedRequests.forEach((request, index) => {
      const seekTime = Math.abs(currentHead - request.trackNumber);
      this.totalSeekTime += seekTime;

      request.serviceTime = this.currentTime;
      request.waitTime = this.currentTime - request.timestamp;

      this.serviceOrder.push({
        request: { ...request },
        fromTrack: currentHead,
        toTrack: request.trackNumber,
        seekTime,
        cumulativeSeekTime: this.totalSeekTime
      });

      currentHead = request.trackNumber;
      this.currentTime++;
    });

    return this.getResults('FCFS');
  }

  // Shortest Seek Time First (SSTF)
  sstf() {
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    let currentHead = this.currentHead;
    const remainingRequests = [...this.requests];

    while (remainingRequests.length > 0) {
      // Find request with shortest seek time
      let shortestIndex = 0;
      let shortestSeekTime = Math.abs(currentHead - remainingRequests[0].trackNumber);

      for (let i = 1; i < remainingRequests.length; i++) {
        const seekTime = Math.abs(currentHead - remainingRequests[i].trackNumber);
        if (seekTime < shortestSeekTime) {
          shortestSeekTime = seekTime;
          shortestIndex = i;
        }
      }

      const request = remainingRequests.splice(shortestIndex, 1)[0];
      this.totalSeekTime += shortestSeekTime;

      request.serviceTime = this.currentTime;
      request.waitTime = this.currentTime - request.timestamp;

      this.serviceOrder.push({
        request: { ...request },
        fromTrack: currentHead,
        toTrack: request.trackNumber,
        seekTime: shortestSeekTime,
        cumulativeSeekTime: this.totalSeekTime
      });

      currentHead = request.trackNumber;
      this.currentTime++;
    }

    return this.getResults('SSTF');
  }

  // SCAN (Elevator Algorithm)
  scan(direction = 'up') {
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    let currentHead = this.currentHead;

    // Sort requests by track number
    const sortedRequests = [...this.requests].sort((a, b) => a.trackNumber - b.trackNumber);

    // Split requests into those above and below current head
    const requestsBelow = sortedRequests.filter(req => req.trackNumber < currentHead);
    const requestsAbove = sortedRequests.filter(req => req.trackNumber >= currentHead);

    let serviceSequence = [];

    if (direction === 'up') {
      // Service requests above current head first (ascending)
      serviceSequence = [...requestsAbove];
      // Then service requests below current head (descending)
      serviceSequence = [...serviceSequence, ...requestsBelow.reverse()];

      // Add movement to end of disk if there are requests above
      if (requestsAbove.length > 0) {
        // Move to end of disk
        const endSeekTime = Math.abs(currentHead - (this.totalTracks - 1));
        this.totalSeekTime += endSeekTime;
        currentHead = this.totalTracks - 1;

        this.serviceOrder.push({
          isMovement: true,
          fromTrack: this.currentHead,
          toTrack: this.totalTracks - 1,
          seekTime: endSeekTime,
          cumulativeSeekTime: this.totalSeekTime,
          description: 'Move to end of disk'
        });
      }
    } else {
      // Service requests below current head first (descending)
      serviceSequence = [...requestsBelow.reverse()];
      // Then service requests above current head (ascending)
      serviceSequence = [...serviceSequence, ...requestsAbove];

      // Add movement to start of disk if there are requests below
      if (requestsBelow.length > 0) {
        // Move to start of disk
        const startSeekTime = Math.abs(currentHead - 0);
        this.totalSeekTime += startSeekTime;
        currentHead = 0;

        this.serviceOrder.push({
          isMovement: true,
          fromTrack: this.currentHead,
          toTrack: 0,
          seekTime: startSeekTime,
          cumulativeSeekTime: this.totalSeekTime,
          description: 'Move to start of disk'
        });
      }
    }

    // Service requests in sequence
    serviceSequence.forEach(request => {
      const seekTime = Math.abs(currentHead - request.trackNumber);
      this.totalSeekTime += seekTime;

      request.serviceTime = this.currentTime;
      request.waitTime = this.currentTime - request.timestamp;

      this.serviceOrder.push({
        request: { ...request },
        fromTrack: currentHead,
        toTrack: request.trackNumber,
        seekTime,
        cumulativeSeekTime: this.totalSeekTime
      });

      currentHead = request.trackNumber;
      this.currentTime++;
    });

    return this.getResults(`SCAN (${direction})`);
  }

  // C-SCAN (Circular SCAN)
  cscan(direction = 'up') {
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    let currentHead = this.currentHead;

    // Sort requests by track number
    const sortedRequests = [...this.requests].sort((a, b) => a.trackNumber - b.trackNumber);

    // Split requests into those above and below current head
    const requestsBelow = sortedRequests.filter(req => req.trackNumber < currentHead);
    const requestsAbove = sortedRequests.filter(req => req.trackNumber >= currentHead);

    let serviceSequence = [];

    if (direction === 'up') {
      // Service requests above current head first
      serviceSequence = [...requestsAbove];

      // Move to end, then to start, then service remaining requests
      if (requestsAbove.length > 0) {
        // Move to end
        const endSeekTime = Math.abs(currentHead - (this.totalTracks - 1));
        this.totalSeekTime += endSeekTime;
        currentHead = this.totalTracks - 1;

        this.serviceOrder.push({
          isMovement: true,
          fromTrack: this.currentHead,
          toTrack: this.totalTracks - 1,
          seekTime: endSeekTime,
          cumulativeSeekTime: this.totalSeekTime,
          description: 'Move to end of disk'
        });

        // Move to start
        const startSeekTime = Math.abs(currentHead - 0);
        this.totalSeekTime += startSeekTime;
        currentHead = 0;

        this.serviceOrder.push({
          isMovement: true,
          fromTrack: this.totalTracks - 1,
          toTrack: 0,
          seekTime: startSeekTime,
          cumulativeSeekTime: this.totalSeekTime,
          description: 'Circular move to start of disk'
        });
      }

      // Add requests below current head (ascending order)
      serviceSequence = [...serviceSequence, ...requestsBelow];
    } else {
      // Service requests below current head first (descending)
      serviceSequence = [...requestsBelow.reverse()];

      // Move to start, then to end, then service remaining requests
      if (requestsBelow.length > 0) {
        // Move to start
        const startSeekTime = Math.abs(currentHead - 0);
        this.totalSeekTime += startSeekTime;
        currentHead = 0;

        this.serviceOrder.push({
          isMovement: true,
          fromTrack: this.currentHead,
          toTrack: 0,
          seekTime: startSeekTime,
          cumulativeSeekTime: this.totalSeekTime,
          description: 'Move to start of disk'
        });

        // Move to end
        const endSeekTime = Math.abs(currentHead - (this.totalTracks - 1));
        this.totalSeekTime += endSeekTime;
        currentHead = this.totalTracks - 1;

        this.serviceOrder.push({
          isMovement: true,
          fromTrack: 0,
          toTrack: this.totalTracks - 1,
          seekTime: endSeekTime,
          cumulativeSeekTime: this.totalSeekTime,
          description: 'Circular move to end of disk'
        });
      }

      // Add requests above current head (descending order)
      serviceSequence = [...serviceSequence, ...requestsAbove.reverse()];
    }

    // Service requests in sequence
    serviceSequence.forEach(request => {
      const seekTime = Math.abs(currentHead - request.trackNumber);
      this.totalSeekTime += seekTime;

      request.serviceTime = this.currentTime;
      request.waitTime = this.currentTime - request.timestamp;

      this.serviceOrder.push({
        request: { ...request },
        fromTrack: currentHead,
        toTrack: request.trackNumber,
        seekTime,
        cumulativeSeekTime: this.totalSeekTime
      });

      currentHead = request.trackNumber;
      this.currentTime++;
    });

    return this.getResults(`C-SCAN (${direction})`);
  }

  // LOOK
  look(direction = 'up') {
    this.serviceOrder = [];
    this.totalSeekTime = 0;
    let currentHead = this.currentHead;

    // Sort requests by track number
    const sortedRequests = [...this.requests].sort((a, b) => a.trackNumber - b.trackNumber);

    // Split requests into those above and below current head
    const requestsBelow = sortedRequests.filter(req => req.trackNumber < currentHead);
    const requestsAbove = sortedRequests.filter(req => req.trackNumber >= currentHead);

    let serviceSequence = [];

    if (direction === 'up') {
      // Service requests above current head first (ascending)
      serviceSequence = [...requestsAbove];
      // Then service requests below current head (descending)
      serviceSequence = [...serviceSequence, ...requestsBelow.reverse()];
    } else {
      // Service requests below current head first (descending)
      serviceSequence = [...requestsBelow.reverse()];
      // Then service requests above current head (ascending)
      serviceSequence = [...serviceSequence, ...requestsAbove];
    }

    // Service requests in sequence
    serviceSequence.forEach(request => {
      const seekTime = Math.abs(currentHead - request.trackNumber);
      this.totalSeekTime += seekTime;

      request.serviceTime = this.currentTime;
      request.waitTime = this.currentTime - request.timestamp;

      this.serviceOrder.push({
        request: { ...request },
        fromTrack: currentHead,
        toTrack: request.trackNumber,
        seekTime,
        cumulativeSeekTime: this.totalSeekTime
      });

      currentHead = request.trackNumber;
      this.currentTime++;
    });

    return this.getResults(`LOOK (${direction})`);
  }

  getResults(algorithm) {
    const totalRequests = this.requests.length;
    const averageSeekTime = totalRequests > 0 ? this.totalSeekTime / totalRequests : 0;
    const totalWaitTime = this.requests.reduce((sum, req) => sum + (req.waitTime || 0), 0);
    const averageWaitTime = totalRequests > 0 ? totalWaitTime / totalRequests : 0;

    return {
      algorithm,
      totalSeekTime: this.totalSeekTime,
      averageSeekTime,
      totalWaitTime,
      averageWaitTime,
      totalRequests,
      serviceOrder: this.serviceOrder,
      requests: this.requests.map(req => ({ ...req })),
      initialHead: this.initialHead,
      finalHead: this.serviceOrder.length > 0 ?
        this.serviceOrder[this.serviceOrder.length - 1].toTrack : this.initialHead
    };
  }
}

module.exports = { DiskScheduler, DiskRequest };