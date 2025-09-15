class Page {
  constructor(pageNumber, frameNumber = null, isValid = false, isDirty = false, lastAccessed = 0) {
    this.pageNumber = pageNumber;
    this.frameNumber = frameNumber;
    this.isValid = isValid;
    this.isDirty = isDirty;
    this.lastAccessed = lastAccessed;
    this.loadTime = 0;
  }
}

class Frame {
  constructor(frameNumber, pageNumber = null, isOccupied = false) {
    this.frameNumber = frameNumber;
    this.pageNumber = pageNumber;
    this.isOccupied = isOccupied;
  }
}

class VirtualMemoryManager {
  constructor(pageSize = 4, numberOfFrames = 4, numberOfPages = 8) {
    this.pageSize = pageSize; // KB
    this.numberOfFrames = numberOfFrames;
    this.numberOfPages = numberOfPages;
    this.frames = [];
    this.pageTable = [];
    this.accessHistory = [];
    this.statistics = {
      pageHits: 0,
      pageFaults: 0,
      pageReplacements: 0
    };
    this.currentTime = 0;

    this.initializeMemory();
  }

  initializeMemory() {
    // Initialize frames
    for (let i = 0; i < this.numberOfFrames; i++) {
      this.frames.push(new Frame(i));
    }

    // Initialize page table
    for (let i = 0; i < this.numberOfPages; i++) {
      this.pageTable.push(new Page(i));
    }
  }

  reset() {
    this.frames = [];
    this.pageTable = [];
    this.accessHistory = [];
    this.statistics = {
      pageHits: 0,
      pageFaults: 0,
      pageReplacements: 0
    };
    this.currentTime = 0;
    this.initializeMemory();
  }

  // FIFO Page Replacement
  accessPageFIFO(pageNumber) {
    this.currentTime++;
    const page = this.pageTable[pageNumber];

    if (page.isValid) {
      // Page hit
      this.statistics.pageHits++;
      page.lastAccessed = this.currentTime;

      this.accessHistory.push({
        pageNumber,
        type: 'hit',
        frameNumber: page.frameNumber,
        algorithm: 'FIFO',
        timestamp: this.currentTime
      });

      return { hit: true, frameNumber: page.frameNumber };
    } else {
      // Page fault
      this.statistics.pageFaults++;
      let replacedPage = null;
      let frameNumber;

      // Find empty frame
      const emptyFrame = this.frames.find(frame => !frame.isOccupied);

      if (emptyFrame) {
        // Use empty frame
        frameNumber = emptyFrame.frameNumber;
        emptyFrame.isOccupied = true;
        emptyFrame.pageNumber = pageNumber;
      } else {
        // Need to replace a page (FIFO)
        const oldestPage = this.pageTable
          .filter(p => p.isValid)
          .reduce((oldest, current) =>
            current.loadTime < oldest.loadTime ? current : oldest
          );

        replacedPage = oldestPage.pageNumber;
        frameNumber = oldestPage.frameNumber;

        // Update old page
        oldestPage.isValid = false;
        oldestPage.frameNumber = null;

        // Update frame
        this.frames[frameNumber].pageNumber = pageNumber;

        this.statistics.pageReplacements++;
      }

      // Update new page
      page.isValid = true;
      page.frameNumber = frameNumber;
      page.lastAccessed = this.currentTime;
      page.loadTime = this.currentTime;

      this.accessHistory.push({
        pageNumber,
        type: 'fault',
        frameNumber,
        replacedPage,
        algorithm: 'FIFO',
        timestamp: this.currentTime
      });

      return { hit: false, frameNumber, replacedPage };
    }
  }

  // LRU Page Replacement
  accessPageLRU(pageNumber) {
    this.currentTime++;
    const page = this.pageTable[pageNumber];

    if (page.isValid) {
      // Page hit
      this.statistics.pageHits++;
      page.lastAccessed = this.currentTime;

      this.accessHistory.push({
        pageNumber,
        type: 'hit',
        frameNumber: page.frameNumber,
        algorithm: 'LRU',
        timestamp: this.currentTime
      });

      return { hit: true, frameNumber: page.frameNumber };
    } else {
      // Page fault
      this.statistics.pageFaults++;
      let replacedPage = null;
      let frameNumber;

      // Find empty frame
      const emptyFrame = this.frames.find(frame => !frame.isOccupied);

      if (emptyFrame) {
        // Use empty frame
        frameNumber = emptyFrame.frameNumber;
        emptyFrame.isOccupied = true;
        emptyFrame.pageNumber = pageNumber;
      } else {
        // Need to replace a page (LRU)
        const lruPage = this.pageTable
          .filter(p => p.isValid)
          .reduce((lru, current) =>
            current.lastAccessed < lru.lastAccessed ? current : lru
          );

        replacedPage = lruPage.pageNumber;
        frameNumber = lruPage.frameNumber;

        // Update old page
        lruPage.isValid = false;
        lruPage.frameNumber = null;

        // Update frame
        this.frames[frameNumber].pageNumber = pageNumber;

        this.statistics.pageReplacements++;
      }

      // Update new page
      page.isValid = true;
      page.frameNumber = frameNumber;
      page.lastAccessed = this.currentTime;
      page.loadTime = this.currentTime;

      this.accessHistory.push({
        pageNumber,
        type: 'fault',
        frameNumber,
        replacedPage,
        algorithm: 'LRU',
        timestamp: this.currentTime
      });

      return { hit: false, frameNumber, replacedPage };
    }
  }

  // Optimal Page Replacement (requires future access pattern)
  accessPageOptimal(pageNumber, futureAccesses = []) {
    this.currentTime++;
    const page = this.pageTable[pageNumber];

    if (page.isValid) {
      // Page hit
      this.statistics.pageHits++;
      page.lastAccessed = this.currentTime;

      this.accessHistory.push({
        pageNumber,
        type: 'hit',
        frameNumber: page.frameNumber,
        algorithm: 'Optimal',
        timestamp: this.currentTime
      });

      return { hit: true, frameNumber: page.frameNumber };
    } else {
      // Page fault
      this.statistics.pageFaults++;
      let replacedPage = null;
      let frameNumber;

      // Find empty frame
      const emptyFrame = this.frames.find(frame => !frame.isOccupied);

      if (emptyFrame) {
        // Use empty frame
        frameNumber = emptyFrame.frameNumber;
        emptyFrame.isOccupied = true;
        emptyFrame.pageNumber = pageNumber;
      } else {
        // Need to replace a page (Optimal)
        const validPages = this.pageTable.filter(p => p.isValid);
        let pageToReplace = validPages[0];
        let farthestAccess = -1;

        for (const validPage of validPages) {
          const nextAccess = futureAccesses.findIndex(access => access === validPage.pageNumber);

          if (nextAccess === -1) {
            // Page never accessed again - best candidate
            pageToReplace = validPage;
            break;
          } else if (nextAccess > farthestAccess) {
            farthestAccess = nextAccess;
            pageToReplace = validPage;
          }
        }

        replacedPage = pageToReplace.pageNumber;
        frameNumber = pageToReplace.frameNumber;

        // Update old page
        pageToReplace.isValid = false;
        pageToReplace.frameNumber = null;

        // Update frame
        this.frames[frameNumber].pageNumber = pageNumber;

        this.statistics.pageReplacements++;
      }

      // Update new page
      page.isValid = true;
      page.frameNumber = frameNumber;
      page.lastAccessed = this.currentTime;
      page.loadTime = this.currentTime;

      this.accessHistory.push({
        pageNumber,
        type: 'fault',
        frameNumber,
        replacedPage,
        algorithm: 'Optimal',
        timestamp: this.currentTime
      });

      return { hit: false, frameNumber, replacedPage };
    }
  }

  // Process a sequence of page accesses
  processSequence(sequence, algorithm = 'FIFO') {
    this.reset();
    const results = [];

    for (let i = 0; i < sequence.length; i++) {
      const pageNumber = sequence[i];
      let result;

      switch (algorithm) {
        case 'FIFO':
          result = this.accessPageFIFO(pageNumber);
          break;
        case 'LRU':
          result = this.accessPageLRU(pageNumber);
          break;
        case 'Optimal':
          const futureAccesses = sequence.slice(i + 1);
          result = this.accessPageOptimal(pageNumber, futureAccesses);
          break;
        default:
          throw new Error('Unknown algorithm');
      }

      results.push({
        step: i + 1,
        pageNumber,
        ...result,
        memoryState: this.getMemoryState()
      });
    }

    return {
      algorithm,
      sequence,
      results,
      finalStatistics: this.getStatistics(),
      finalMemoryState: this.getMemoryState()
    };
  }

  getMemoryState() {
    return {
      frames: this.frames.map(frame => ({
        frameNumber: frame.frameNumber,
        pageNumber: frame.pageNumber,
        isOccupied: frame.isOccupied
      })),
      pageTable: this.pageTable.map(page => ({
        pageNumber: page.pageNumber,
        frameNumber: page.frameNumber,
        isValid: page.isValid,
        lastAccessed: page.lastAccessed,
        loadTime: page.loadTime
      })),
      currentTime: this.currentTime
    };
  }

  getStatistics() {
    const totalAccesses = this.statistics.pageHits + this.statistics.pageFaults;
    const hitRatio = totalAccesses > 0 ? (this.statistics.pageHits / totalAccesses) * 100 : 0;
    const faultRatio = totalAccesses > 0 ? (this.statistics.pageFaults / totalAccesses) * 100 : 0;

    return {
      pageHits: this.statistics.pageHits,
      pageFaults: this.statistics.pageFaults,
      pageReplacements: this.statistics.pageReplacements,
      totalAccesses,
      hitRatio,
      faultRatio
    };
  }
}

module.exports = { VirtualMemoryManager, Page, Frame };