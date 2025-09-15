const express = require('express');
const { MemoryManager } = require('../algorithms/memoryManagement');
const { VirtualMemoryManager } = require('../algorithms/virtualMemory');

const router = express.Router();

// Create memory manager instances
let memoryManager = new MemoryManager(1024); // Default 1024 KB
let virtualMemoryManager = new VirtualMemoryManager(4, 4, 8); // 4KB pages, 4 frames, 8 pages

// Initialize memory manager
router.post('/initialize', (req, res) => {
  try {
    const { totalMemory = 1024 } = req.body;

    if (totalMemory <= 0) {
      return res.status(400).json({ error: 'Total memory must be greater than 0' });
    }

    memoryManager = new MemoryManager(totalMemory);

    res.json({
      message: 'Memory manager initialized',
      totalMemory,
      state: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory allocation algorithms info
router.get('/algorithms', (req, res) => {
  res.json({
    algorithms: [
      {
        id: 'firstFit',
        name: 'First Fit',
        description: 'Allocates the first free block that is large enough'
      },
      {
        id: 'bestFit',
        name: 'Best Fit',
        description: 'Allocates the smallest free block that is large enough'
      },
      {
        id: 'worstFit',
        name: 'Worst Fit',
        description: 'Allocates the largest free block available'
      }
    ]
  });
});

// Allocate memory using First Fit
router.post('/allocate/firstfit', (req, res) => {
  try {
    const { processId, size } = req.body;

    if (!processId || !size) {
      return res.status(400).json({ error: 'Process ID and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'Size must be greater than 0' });
    }

    const result = memoryManager.firstFit(processId, size);

    res.json({
      algorithm: 'First Fit',
      ...result,
      memoryState: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allocate memory using Best Fit
router.post('/allocate/bestfit', (req, res) => {
  try {
    const { processId, size } = req.body;

    if (!processId || !size) {
      return res.status(400).json({ error: 'Process ID and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'Size must be greater than 0' });
    }

    const result = memoryManager.bestFit(processId, size);

    res.json({
      algorithm: 'Best Fit',
      ...result,
      memoryState: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allocate memory using Worst Fit
router.post('/allocate/worstfit', (req, res) => {
  try {
    const { processId, size } = req.body;

    if (!processId || !size) {
      return res.status(400).json({ error: 'Process ID and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'Size must be greater than 0' });
    }

    const result = memoryManager.worstFit(processId, size);

    res.json({
      algorithm: 'Worst Fit',
      ...result,
      memoryState: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deallocate memory
router.post('/deallocate', (req, res) => {
  try {
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    const result = memoryManager.deallocate(processId);

    res.json({
      ...result,
      memoryState: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compact memory (defragmentation)
router.post('/compact', (req, res) => {
  try {
    const result = memoryManager.compact();

    res.json({
      ...result,
      memoryState: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current memory state
router.get('/state', (req, res) => {
  try {
    const state = memoryManager.getMemoryState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset memory manager
router.post('/reset', (req, res) => {
  try {
    memoryManager.reset();

    res.json({
      message: 'Memory manager reset',
      memoryState: memoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare allocation algorithms
router.post('/compare', (req, res) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests array is required' });
    }

    const algorithms = ['firstFit', 'bestFit', 'worstFit'];
    const results = {};

    algorithms.forEach(algorithm => {
      // Create fresh memory manager for each algorithm
      const tempManager = new MemoryManager(memoryManager.totalMemory);
      const allocationResults = [];
      let successfulAllocations = 0;
      let failedAllocations = 0;

      requests.forEach(request => {
        const { processId, size, action = 'allocate' } = request;

        if (action === 'allocate') {
          let result;
          switch (algorithm) {
            case 'firstFit':
              result = tempManager.firstFit(processId, size);
              break;
            case 'bestFit':
              result = tempManager.bestFit(processId, size);
              break;
            case 'worstFit':
              result = tempManager.worstFit(processId, size);
              break;
          }

          allocationResults.push({
            processId,
            size,
            success: result.success,
            startAddress: result.startAddress || null
          });

          if (result.success) {
            successfulAllocations++;
          } else {
            failedAllocations++;
          }
        } else if (action === 'deallocate') {
          const result = tempManager.deallocate(processId);
          allocationResults.push({
            processId,
            action: 'deallocate',
            success: result.success
          });
        }
      });

      const finalState = tempManager.getMemoryState();

      results[algorithm] = {
        name: algorithm === 'firstFit' ? 'First Fit' :
              algorithm === 'bestFit' ? 'Best Fit' : 'Worst Fit',
        successfulAllocations,
        failedAllocations,
        utilizationPercentage: finalState.summary.utilizationPercentage,
        fragmentationPercentage: finalState.summary.fragmentationPercentage,
        numberOfFreeBlocks: finalState.summary.numberOfFreeBlocks,
        largestFreeBlock: finalState.summary.largestFreeBlock,
        allocationResults,
        finalMemoryState: finalState
      };
    });

    res.json({
      comparison: results,
      totalRequests: requests.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Virtual Memory Routes

// Initialize virtual memory
router.post('/virtual/initialize', (req, res) => {
  try {
    const { pageSize = 4, numberOfFrames = 4, numberOfPages = 8 } = req.body;

    if (pageSize <= 0 || numberOfFrames <= 0 || numberOfPages <= 0) {
      return res.status(400).json({ error: 'All parameters must be greater than 0' });
    }

    virtualMemoryManager = new VirtualMemoryManager(pageSize, numberOfFrames, numberOfPages);

    res.json({
      message: 'Virtual memory manager initialized',
      configuration: {
        pageSize,
        numberOfFrames,
        numberOfPages
      },
      state: virtualMemoryManager.getMemoryState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get page replacement algorithms
router.get('/virtual/algorithms', (req, res) => {
  res.json({
    algorithms: [
      {
        id: 'FIFO',
        name: 'First In First Out',
        description: 'Replaces the page that was loaded earliest'
      },
      {
        id: 'LRU',
        name: 'Least Recently Used',
        description: 'Replaces the page that was accessed least recently'
      },
      {
        id: 'Optimal',
        name: 'Optimal (Farthest in Future)',
        description: 'Replaces the page that will be accessed farthest in the future'
      }
    ]
  });
});

// Process page access sequence
router.post('/virtual/sequence', (req, res) => {
  try {
    const { sequence, algorithm = 'FIFO' } = req.body;

    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({ error: 'Page sequence array is required' });
    }

    if (!['FIFO', 'LRU', 'Optimal'].includes(algorithm)) {
      return res.status(400).json({ error: 'Invalid algorithm. Use FIFO, LRU, or Optimal' });
    }

    // Validate page numbers
    const maxPage = virtualMemoryManager.numberOfPages - 1;
    const invalidPages = sequence.filter(page => page < 0 || page > maxPage);
    if (invalidPages.length > 0) {
      return res.status(400).json({
        error: `Invalid page numbers: ${invalidPages.join(', ')}. Pages must be between 0 and ${maxPage}`
      });
    }

    const result = virtualMemoryManager.processSequence(sequence, algorithm);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare page replacement algorithms
router.post('/virtual/compare', (req, res) => {
  try {
    const { sequence } = req.body;

    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({ error: 'Page sequence array is required' });
    }

    const algorithms = ['FIFO', 'LRU', 'Optimal'];
    const results = {};

    algorithms.forEach(algorithm => {
      // Create fresh virtual memory manager for each algorithm
      const tempManager = new VirtualMemoryManager(
        virtualMemoryManager.pageSize,
        virtualMemoryManager.numberOfFrames,
        virtualMemoryManager.numberOfPages
      );

      const result = tempManager.processSequence(sequence, algorithm);
      results[algorithm] = {
        algorithm: result.algorithm,
        statistics: result.finalStatistics,
        finalMemoryState: result.finalMemoryState
      };
    });

    res.json({
      sequence,
      comparison: results,
      configuration: {
        pageSize: virtualMemoryManager.pageSize,
        numberOfFrames: virtualMemoryManager.numberOfFrames,
        numberOfPages: virtualMemoryManager.numberOfPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get virtual memory state
router.get('/virtual/state', (req, res) => {
  try {
    const state = virtualMemoryManager.getMemoryState();
    const statistics = virtualMemoryManager.getStatistics();

    res.json({
      state,
      statistics,
      configuration: {
        pageSize: virtualMemoryManager.pageSize,
        numberOfFrames: virtualMemoryManager.numberOfFrames,
        numberOfPages: virtualMemoryManager.numberOfPages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset virtual memory
router.post('/virtual/reset', (req, res) => {
  try {
    virtualMemoryManager.reset();

    res.json({
      message: 'Virtual memory manager reset',
      state: virtualMemoryManager.getMemoryState(),
      statistics: virtualMemoryManager.getStatistics()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;