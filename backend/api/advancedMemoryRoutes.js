const express = require('express');
const { AdvancedMemoryManager } = require('../algorithms/advancedMemory');

const router = express.Router();

// Create advanced memory manager instance
let memoryManager = new AdvancedMemoryManager();

// Get advanced memory management info
router.get('/info', (req, res) => {
  res.json({
    name: 'Advanced Memory Management',
    description: 'Comprehensive memory management with segmentation, paging, mapping, and garbage collection',
    features: [
      'Memory segmentation with protection',
      'Advanced paging with working sets',
      'Memory-mapped files',
      'Garbage collection simulation',
      'Fragmentation analysis',
      'Working set calculation',
      'Memory statistics and profiling'
    ],
    algorithms: [
      { name: 'Segmentation', description: 'Memory divided into logical segments with permissions' },
      { name: 'Paging', description: 'Fixed-size page frames with virtual memory' },
      { name: 'Memory Mapping', description: 'Map files directly into memory space' },
      { name: 'Mark & Sweep GC', description: 'Traditional garbage collection algorithm' },
      { name: 'Generational GC', description: 'Optimized GC for different object lifetimes' }
    ]
  });
});

// Reset memory manager
router.post('/reset', (req, res) => {
  try {
    const { totalMemory, pageSize, segmentSize } = req.body;

    if (totalMemory) {
      memoryManager = new AdvancedMemoryManager(totalMemory, pageSize, segmentSize);
    } else {
      memoryManager.reset();
    }

    res.json({
      message: 'Advanced memory manager reset successfully',
      state: memoryManager.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system state
router.get('/state', (req, res) => {
  try {
    const state = memoryManager.getSystemState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Segmentation Routes

// Create segment
router.post('/segment/create', (req, res) => {
  try {
    const { processId, segmentName, size, permissions = 'RW' } = req.body;

    if (!processId || !segmentName || !size) {
      return res.status(400).json({ error: 'Process ID, segment name, and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'Size must be positive' });
    }

    const validPermissions = /^[RWX]+$/;
    if (!validPermissions.test(permissions)) {
      return res.status(400).json({ error: 'Invalid permissions. Use R, W, X combinations' });
    }

    const result = memoryManager.createSegment(processId, segmentName, size, permissions);

    res.json({
      operation: 'create_segment',
      processId,
      segmentName,
      size,
      permissions,
      ...result,
      systemState: memoryManager.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Access segment
router.post('/segment/access', (req, res) => {
  try {
    const { processId, segmentId, offset, operation = 'R' } = req.body;

    if (!processId || segmentId === undefined || offset === undefined) {
      return res.status(400).json({ error: 'Process ID, segment ID, and offset are required' });
    }

    if (offset < 0) {
      return res.status(400).json({ error: 'Offset must be non-negative' });
    }

    if (!['R', 'W', 'X'].includes(operation)) {
      return res.status(400).json({ error: 'Operation must be R, W, or X' });
    }

    const result = memoryManager.accessSegment(processId, segmentId, offset, operation);

    res.json({
      operation: 'access_segment',
      processId,
      segmentId,
      offset,
      accessOperation: operation,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Paging Routes

// Access page
router.post('/page/access', (req, res) => {
  try {
    const { processId, pageNumber, operation = 'R' } = req.body;

    if (!processId || pageNumber === undefined) {
      return res.status(400).json({ error: 'Process ID and page number are required' });
    }

    if (pageNumber < 0) {
      return res.status(400).json({ error: 'Page number must be non-negative' });
    }

    if (!['R', 'W'].includes(operation)) {
      return res.status(400).json({ error: 'Operation must be R or W' });
    }

    const result = memoryManager.accessPage(processId, pageNumber, operation);

    res.json({
      operation: 'access_page',
      processId,
      pageNumber,
      accessOperation: operation,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get working set
router.get('/page/working-set/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    const { timeWindow = 5000 } = req.query;

    const workingSet = memoryManager.getWorkingSet(processId, parseInt(timeWindow));

    res.json({
      processId,
      timeWindow: parseInt(timeWindow),
      workingSet
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Memory Mapping Routes

// Map file
router.post('/mapping/map', (req, res) => {
  try {
    const { filename, size, permissions = 'RW' } = req.body;

    if (!filename || !size) {
      return res.status(400).json({ error: 'Filename and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'Size must be positive' });
    }

    const result = memoryManager.mapFile(filename, size, permissions);

    res.json({
      operation: 'map_file',
      filename,
      size,
      permissions,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unmap file
router.post('/mapping/unmap', (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const result = memoryManager.unmapFile(filename);

    res.json({
      operation: 'unmap_file',
      filename,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Garbage Collection Routes

// Allocate object
router.post('/gc/allocate', (req, res) => {
  try {
    const { size, references = [], generation = 'young' } = req.body;

    if (!size || size <= 0) {
      return res.status(400).json({ error: 'Size must be positive' });
    }

    if (!['young', 'old'].includes(generation)) {
      return res.status(400).json({ error: 'Generation must be young or old' });
    }

    const objectId = memoryManager.allocateObject(size, references, generation);

    res.json({
      operation: 'allocate_object',
      objectId,
      size,
      generation,
      references,
      systemState: memoryManager.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to root set
router.post('/gc/root-set', (req, res) => {
  try {
    const { objectId } = req.body;

    if (objectId === undefined) {
      return res.status(400).json({ error: 'Object ID is required' });
    }

    memoryManager.addToRootSet(objectId);

    res.json({
      operation: 'add_to_root_set',
      objectId,
      rootSetSize: memoryManager.rootSet.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run garbage collection
router.post('/gc/collect', (req, res) => {
  try {
    const { algorithm = 'mark_and_sweep' } = req.body;

    if (!['mark_and_sweep', 'generational'].includes(algorithm)) {
      return res.status(400).json({ error: 'Algorithm must be mark_and_sweep or generational' });
    }

    const result = memoryManager.runGarbageCollection(algorithm);

    res.json({
      operation: 'garbage_collection',
      algorithm,
      ...result,
      systemState: memoryManager.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analysis Routes

// Get fragmentation analysis
router.get('/analysis/fragmentation', (req, res) => {
  try {
    const analysis = memoryManager.analyzeFragmentation();

    res.json({
      analysis: 'memory_fragmentation',
      timestamp: new Date().toISOString(),
      ...analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory statistics
router.get('/statistics', (req, res) => {
  try {
    const state = memoryManager.getSystemState();

    res.json({
      timestamp: new Date().toISOString(),
      memoryUtilization: {
        totalMemory: state.totalMemory,
        usedMemory: state.totalMemory - state.fragmentationAnalysis.totalFreeSpace,
        freeMemory: state.fragmentationAnalysis.totalFreeSpace,
        utilizationPercentage: ((state.totalMemory - state.fragmentationAnalysis.totalFreeSpace) / state.totalMemory) * 100
      },
      segmentation: {
        totalSegments: state.segmentCount,
        allocatedSegments: state.allocatedSegments,
        fragmentationPercentage: state.fragmentationAnalysis.externalFragmentation
      },
      paging: {
        totalFrames: state.pageFrames,
        usedFrames: state.usedFrames,
        freeFrames: state.pageFrames - state.usedFrames,
        pageFaults: state.pageFaults,
        frameUtilization: (state.usedFrames / state.pageFrames) * 100
      },
      garbageCollection: state.gcStats,
      memoryMapping: {
        mappedFilesCount: state.mappedFiles.length,
        mappedFiles: state.mappedFiles
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo simulations

// Run comprehensive memory demo
router.post('/demo/comprehensive', (req, res) => {
  try {
    memoryManager.reset();

    const demo = {
      steps: [],
      timestamp: new Date().toISOString()
    };

    // Step 1: Create segments
    const seg1 = memoryManager.createSegment('P1', 'code', 200, 'RX');
    const seg2 = memoryManager.createSegment('P1', 'data', 100, 'RW');
    const seg3 = memoryManager.createSegment('P2', 'code', 150, 'RX');

    demo.steps.push({
      step: 1,
      action: 'Create segments',
      results: [seg1, seg2, seg3]
    });

    // Step 2: Access pages and segments
    const pageAccess1 = memoryManager.accessPage('P1', 0, 'R');
    const pageAccess2 = memoryManager.accessPage('P1', 1, 'W');
    const segAccess1 = memoryManager.accessSegment('P1', 0, 50, 'X');

    demo.steps.push({
      step: 2,
      action: 'Access memory',
      results: [pageAccess1, pageAccess2, segAccess1]
    });

    // Step 3: Map file
    const mapping = memoryManager.mapFile('shared.dat', 64, 'RW');

    demo.steps.push({
      step: 3,
      action: 'Map file',
      result: mapping
    });

    // Step 4: Allocate objects and run GC
    const obj1 = memoryManager.allocateObject(50, []);
    const obj2 = memoryManager.allocateObject(30, []);
    memoryManager.addToRootSet(obj1);

    const gcResult = memoryManager.runGarbageCollection('mark_and_sweep');

    demo.steps.push({
      step: 4,
      action: 'Garbage collection',
      allocatedObjects: [obj1, obj2],
      gcResult
    });

    // Step 5: Analysis
    const fragmentation = memoryManager.analyzeFragmentation();
    const workingSet = memoryManager.getWorkingSet('P1');

    demo.steps.push({
      step: 5,
      action: 'Memory analysis',
      fragmentation,
      workingSet
    });

    res.json({
      demo: 'Comprehensive Memory Management Demo',
      description: 'Demonstrates segmentation, paging, memory mapping, and garbage collection',
      ...demo,
      finalState: memoryManager.getSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory history
router.get('/history', (req, res) => {
  try {
    const { limit = 50, action } = req.query;

    let history = memoryManager.history;

    if (action) {
      history = history.filter(entry => entry.action === action);
    }

    history = history.slice(-parseInt(limit));

    res.json({
      totalEntries: memoryManager.history.length,
      filteredEntries: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;