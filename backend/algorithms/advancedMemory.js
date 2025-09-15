class Segment {
  constructor(id, name, baseAddress, limit, permissions = 'RW') {
    this.id = id;
    this.name = name;
    this.baseAddress = baseAddress;
    this.limit = limit;
    this.permissions = permissions; // R, W, X combinations
    this.processId = null;
    this.isAllocated = false;
    this.accessCount = 0;
    this.lastAccessed = Date.now();
  }

  getEndAddress() {
    return this.baseAddress + this.limit - 1;
  }

  canAccess(operation) {
    return this.permissions.includes(operation.toUpperCase());
  }

  access(operation) {
    if (this.canAccess(operation)) {
      this.accessCount++;
      this.lastAccessed = Date.now();
      return true;
    }
    return false;
  }
}

class Page {
  constructor(pageNumber, frameNumber = null) {
    this.pageNumber = pageNumber;
    this.frameNumber = frameNumber;
    this.isValid = frameNumber !== null;
    this.isDirty = false;
    this.isReferenced = false;
    this.lastAccessed = Date.now();
    this.accessCount = 0;
    this.loadTime = Date.now();
  }

  access() {
    this.isReferenced = true;
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  modify() {
    this.isDirty = true;
    this.access();
  }
}

class MemoryMappedFile {
  constructor(filename, size, baseAddress, permissions = 'RW') {
    this.filename = filename;
    this.size = size;
    this.baseAddress = baseAddress;
    this.permissions = permissions;
    this.isMapped = true;
    this.accessPattern = [];
    this.createdAt = Date.now();
  }

  access(offset, operation) {
    this.accessPattern.push({
      offset,
      operation,
      timestamp: Date.now()
    });
  }
}

class GarbageCollector {
  constructor() {
    this.collections = [];
    this.totalAllocatedMemory = 0;
    this.totalFreedMemory = 0;
    this.collectionCount = 0;
  }

  markAndSweep(allocatedObjects, rootSet) {
    const startTime = Date.now();
    let marked = new Set();
    let freed = [];

    // Mark phase
    const markQueue = [...rootSet];
    while (markQueue.length > 0) {
      const obj = markQueue.pop();
      if (!marked.has(obj.id)) {
        marked.add(obj.id);
        // Add referenced objects to queue
        if (obj.references) {
          markQueue.push(...obj.references);
        }
      }
    }

    // Sweep phase
    allocatedObjects.forEach(obj => {
      if (!marked.has(obj.id)) {
        freed.push(obj);
        this.totalFreedMemory += obj.size;
      }
    });

    const collection = {
      id: this.collectionCount++,
      startTime,
      duration: Date.now() - startTime,
      memoryFreed: freed.reduce((sum, obj) => sum + obj.size, 0),
      objectsFreed: freed.length,
      objectsMarked: marked.size,
      totalObjects: allocatedObjects.length
    };

    this.collections.push(collection);
    return {
      freedObjects: freed,
      collection
    };
  }

  generationalGC(youngGeneration, oldGeneration, rootSet) {
    const startTime = Date.now();
    let promoted = [];
    let freed = [];

    // Collect young generation more frequently
    youngGeneration.forEach(obj => {
      if (obj.age > 3) { // Promote long-lived objects
        promoted.push(obj);
        oldGeneration.push(obj);
        obj.generation = 'old';
      } else if (!this.isReachable(obj, rootSet)) {
        freed.push(obj);
        this.totalFreedMemory += obj.size;
      } else {
        obj.age++;
      }
    });

    const collection = {
      id: this.collectionCount++,
      type: 'generational',
      startTime,
      duration: Date.now() - startTime,
      memoryFreed: freed.reduce((sum, obj) => sum + obj.size, 0),
      objectsFreed: freed.length,
      objectsPromoted: promoted.length,
      youngGenSize: youngGeneration.length,
      oldGenSize: oldGeneration.length
    };

    this.collections.push(collection);
    return {
      freedObjects: freed,
      promotedObjects: promoted,
      collection
    };
  }

  isReachable(object, rootSet) {
    const visited = new Set();
    const stack = [...rootSet];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current.id === object.id) return true;

      if (!visited.has(current.id)) {
        visited.add(current.id);
        if (current.references) {
          stack.push(...current.references);
        }
      }
    }
    return false;
  }
}

class AdvancedMemoryManager {
  constructor(totalMemory = 2048, pageSize = 64, segmentSize = 256) {
    this.totalMemory = totalMemory;
    this.pageSize = pageSize;
    this.segmentSize = segmentSize;

    // Segmentation
    this.segments = [];
    this.segmentTable = new Map();

    // Paging
    this.pageFrames = Math.floor(totalMemory / pageSize);
    this.pages = new Map();
    this.frameTable = new Array(this.pageFrames).fill(null);
    this.pageFaults = 0;

    // Memory mapping
    this.mappedFiles = new Map();

    // Garbage collection
    this.gc = new GarbageCollector();
    this.allocatedObjects = [];
    this.rootSet = [];

    // Statistics
    this.memoryStats = {
      totalAllocations: 0,
      totalDeallocations: 0,
      currentlyAllocated: 0,
      peakUsage: 0,
      fragmentationRatio: 0
    };

    this.history = [];
  }

  // Segmentation methods
  createSegment(processId, segmentName, size, permissions = 'RW') {
    const segmentId = this.segments.length;
    const baseAddress = this.findFreeSegmentSpace(size);

    if (baseAddress === -1) {
      return { success: false, error: 'Insufficient memory for segment' };
    }

    const segment = new Segment(segmentId, segmentName, baseAddress, size, permissions);
    segment.processId = processId;
    segment.isAllocated = true;

    this.segments.push(segment);

    if (!this.segmentTable.has(processId)) {
      this.segmentTable.set(processId, []);
    }
    this.segmentTable.get(processId).push(segment);

    this.history.push({
      action: 'segment_create',
      processId,
      segmentId,
      segmentName,
      size,
      baseAddress,
      permissions,
      timestamp: Date.now()
    });

    return {
      success: true,
      segment: {
        id: segmentId,
        name: segmentName,
        baseAddress,
        size,
        permissions
      }
    };
  }

  accessSegment(processId, segmentId, offset, operation = 'R') {
    const segments = this.segmentTable.get(processId);
    if (!segments) {
      return { success: false, error: 'Process not found' };
    }

    const segment = segments.find(s => s.id === segmentId);
    if (!segment) {
      return { success: false, error: 'Segment not found' };
    }

    if (offset >= segment.limit) {
      return { success: false, error: 'Segmentation fault: offset out of bounds' };
    }

    if (!segment.canAccess(operation)) {
      return { success: false, error: `Permission denied: cannot ${operation} segment` };
    }

    segment.access(operation);
    const physicalAddress = segment.baseAddress + offset;

    this.history.push({
      action: 'segment_access',
      processId,
      segmentId,
      offset,
      operation,
      physicalAddress,
      success: true,
      timestamp: Date.now()
    });

    return {
      success: true,
      physicalAddress,
      segmentName: segment.name
    };
  }

  // Advanced paging with working set
  accessPage(processId, pageNumber, operation = 'R') {
    const pageKey = `${processId}_${pageNumber}`;
    let page = this.pages.get(pageKey);

    if (!page || !page.isValid) {
      // Page fault
      this.pageFaults++;
      const frameNumber = this.allocateFrame();

      if (frameNumber === -1) {
        // Need to evict a page
        const victimFrame = this.selectVictimPage();
        frameNumber = victimFrame;
      }

      page = new Page(pageNumber, frameNumber);
      this.pages.set(pageKey, page);
      this.frameTable[frameNumber] = pageKey;

      this.history.push({
        action: 'page_fault',
        processId,
        pageNumber,
        frameNumber,
        operation,
        timestamp: Date.now()
      });
    }

    page.access();
    if (operation === 'W') {
      page.modify();
    }

    this.history.push({
      action: 'page_access',
      processId,
      pageNumber,
      frameNumber: page.frameNumber,
      operation,
      hit: page.isValid,
      timestamp: Date.now()
    });

    return {
      success: true,
      frameNumber: page.frameNumber,
      physicalAddress: page.frameNumber * this.pageSize,
      pageFault: !page.isValid
    };
  }

  // Memory mapping
  mapFile(filename, size, permissions = 'RW') {
    const baseAddress = this.findFreeSpace(size);
    if (baseAddress === -1) {
      return { success: false, error: 'Insufficient memory for mapping' };
    }

    const mappedFile = new MemoryMappedFile(filename, size, baseAddress, permissions);
    this.mappedFiles.set(filename, mappedFile);

    this.history.push({
      action: 'file_map',
      filename,
      size,
      baseAddress,
      permissions,
      timestamp: Date.now()
    });

    return {
      success: true,
      baseAddress,
      size
    };
  }

  unmapFile(filename) {
    const mappedFile = this.mappedFiles.get(filename);
    if (!mappedFile) {
      return { success: false, error: 'File not mapped' };
    }

    this.mappedFiles.delete(filename);

    this.history.push({
      action: 'file_unmap',
      filename,
      timestamp: Date.now()
    });

    return { success: true };
  }

  // Garbage collection simulation
  allocateObject(size, references = [], generation = 'young') {
    const objectId = this.allocatedObjects.length;
    const object = {
      id: objectId,
      size,
      references,
      generation,
      age: 0,
      allocatedAt: Date.now()
    };

    this.allocatedObjects.push(object);
    this.memoryStats.totalAllocations++;
    this.memoryStats.currentlyAllocated += size;
    this.memoryStats.peakUsage = Math.max(this.memoryStats.peakUsage, this.memoryStats.currentlyAllocated);

    return objectId;
  }

  addToRootSet(objectId) {
    const object = this.allocatedObjects.find(obj => obj.id === objectId);
    if (object && !this.rootSet.includes(object)) {
      this.rootSet.push(object);
    }
  }

  runGarbageCollection(algorithm = 'mark_and_sweep') {
    let result;
    const youngGen = this.allocatedObjects.filter(obj => obj.generation === 'young');
    const oldGen = this.allocatedObjects.filter(obj => obj.generation === 'old');

    if (algorithm === 'generational') {
      result = this.gc.generationalGC(youngGen, oldGen, this.rootSet);
    } else {
      result = this.gc.markAndSweep(this.allocatedObjects, this.rootSet);
    }

    // Update allocated objects
    this.allocatedObjects = this.allocatedObjects.filter(obj =>
      !result.freedObjects.find(freed => freed.id === obj.id)
    );

    this.memoryStats.totalDeallocations += result.freedObjects.length;
    this.memoryStats.currentlyAllocated -= result.collection.memoryFreed;

    this.history.push({
      action: 'garbage_collection',
      algorithm,
      ...result.collection,
      timestamp: Date.now()
    });

    return result;
  }

  // Memory analysis methods
  analyzeFragmentation() {
    const freeSegments = this.segments.filter(s => !s.isAllocated);
    const totalFreeSpace = freeSegments.reduce((sum, s) => sum + s.limit, 0);
    const largestFreeBlock = Math.max(...freeSegments.map(s => s.limit), 0);

    const externalFragmentation = totalFreeSpace > 0 ?
      (totalFreeSpace - largestFreeBlock) / totalFreeSpace : 0;

    return {
      totalFreeSpace,
      largestFreeBlock,
      freeSegmentCount: freeSegments.length,
      externalFragmentation: externalFragmentation * 100,
      averageFreeBlockSize: freeSegments.length > 0 ? totalFreeSpace / freeSegments.length : 0
    };
  }

  getWorkingSet(processId, timeWindow = 5000) {
    const currentTime = Date.now();
    const recentAccesses = this.history.filter(entry =>
      entry.processId === processId &&
      entry.action === 'page_access' &&
      (currentTime - entry.timestamp) <= timeWindow
    );

    const uniquePages = new Set(recentAccesses.map(access => access.pageNumber));
    return {
      size: uniquePages.size,
      pages: Array.from(uniquePages),
      accessCount: recentAccesses.length
    };
  }

  // Helper methods
  findFreeSegmentSpace(size) {
    let currentAddress = 0;
    const sortedSegments = this.segments
      .filter(s => s.isAllocated)
      .sort((a, b) => a.baseAddress - b.baseAddress);

    for (const segment of sortedSegments) {
      if (segment.baseAddress - currentAddress >= size) {
        return currentAddress;
      }
      currentAddress = segment.getEndAddress() + 1;
    }

    if (this.totalMemory - currentAddress >= size) {
      return currentAddress;
    }

    return -1;
  }

  findFreeSpace(size) {
    return this.findFreeSegmentSpace(size);
  }

  allocateFrame() {
    for (let i = 0; i < this.frameTable.length; i++) {
      if (this.frameTable[i] === null) {
        return i;
      }
    }
    return -1;
  }

  selectVictimPage() {
    // LRU eviction
    let oldestTime = Date.now();
    let victimFrame = 0;

    for (let i = 0; i < this.frameTable.length; i++) {
      const pageKey = this.frameTable[i];
      if (pageKey) {
        const page = this.pages.get(pageKey);
        if (page.lastAccessed < oldestTime) {
          oldestTime = page.lastAccessed;
          victimFrame = i;
        }
      }
    }

    return victimFrame;
  }

  getSystemState() {
    return {
      totalMemory: this.totalMemory,
      pageSize: this.pageSize,
      segmentCount: this.segments.length,
      allocatedSegments: this.segments.filter(s => s.isAllocated).length,
      pageFrames: this.pageFrames,
      usedFrames: this.frameTable.filter(f => f !== null).length,
      pageFaults: this.pageFaults,
      mappedFiles: Array.from(this.mappedFiles.keys()),
      memoryStats: this.memoryStats,
      fragmentationAnalysis: this.analyzeFragmentation(),
      gcStats: {
        totalCollections: this.gc.collections.length,
        totalFreedMemory: this.gc.totalFreedMemory,
        allocatedObjectsCount: this.allocatedObjects.length,
        rootSetSize: this.rootSet.length
      }
    };
  }

  reset() {
    this.segments = [];
    this.segmentTable.clear();
    this.pages.clear();
    this.frameTable.fill(null);
    this.mappedFiles.clear();
    this.allocatedObjects = [];
    this.rootSet = [];
    this.pageFaults = 0;
    this.gc = new GarbageCollector();
    this.memoryStats = {
      totalAllocations: 0,
      totalDeallocations: 0,
      currentlyAllocated: 0,
      peakUsage: 0,
      fragmentationRatio: 0
    };
    this.history = [];
  }
}

module.exports = { AdvancedMemoryManager, Segment, Page, MemoryMappedFile, GarbageCollector };