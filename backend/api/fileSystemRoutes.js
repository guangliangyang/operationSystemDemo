const express = require('express');
const { FileSystemManager } = require('../algorithms/fileSystem');
const { DiskScheduler } = require('../algorithms/diskScheduling');

const router = express.Router();

// Create file system and disk scheduler instances
let fileSystemManager = new FileSystemManager(20, 1); // 20 blocks, 1KB each
let diskScheduler = new DiskScheduler(200, 100); // 200 tracks, head at 100

// File System Routes

// Initialize file system
router.post('/initialize', (req, res) => {
  try {
    const { totalBlocks = 20, blockSize = 1 } = req.body;

    if (totalBlocks <= 0 || blockSize <= 0) {
      return res.status(400).json({ error: 'Total blocks and block size must be greater than 0' });
    }

    fileSystemManager = new FileSystemManager(totalBlocks, blockSize);

    res.json({
      message: 'File system initialized',
      configuration: {
        totalBlocks,
        blockSize
      },
      state: fileSystemManager.getFileSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file allocation methods
router.get('/allocation-methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'contiguous',
        name: 'Contiguous Allocation',
        description: 'Files are stored in consecutive blocks on disk'
      },
      {
        id: 'linked',
        name: 'Linked Allocation',
        description: 'File blocks are linked together using pointers'
      },
      {
        id: 'indexed',
        name: 'Indexed Allocation',
        description: 'Uses an index block to point to all file blocks'
      }
    ]
  });
});

// Allocate file using contiguous method
router.post('/allocate/contiguous', (req, res) => {
  try {
    const { fileId, fileName, size } = req.body;

    if (!fileId || !fileName || !size) {
      return res.status(400).json({ error: 'File ID, name, and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'File size must be greater than 0' });
    }

    const result = fileSystemManager.allocateContiguous(fileId, fileName, size);

    res.json({
      method: 'Contiguous Allocation',
      ...result,
      fileSystemState: fileSystemManager.getFileSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allocate file using linked method
router.post('/allocate/linked', (req, res) => {
  try {
    const { fileId, fileName, size } = req.body;

    if (!fileId || !fileName || !size) {
      return res.status(400).json({ error: 'File ID, name, and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'File size must be greater than 0' });
    }

    const result = fileSystemManager.allocateLinked(fileId, fileName, size);

    res.json({
      method: 'Linked Allocation',
      ...result,
      fileSystemState: fileSystemManager.getFileSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allocate file using indexed method
router.post('/allocate/indexed', (req, res) => {
  try {
    const { fileId, fileName, size } = req.body;

    if (!fileId || !fileName || !size) {
      return res.status(400).json({ error: 'File ID, name, and size are required' });
    }

    if (size <= 0) {
      return res.status(400).json({ error: 'File size must be greater than 0' });
    }

    const result = fileSystemManager.allocateIndexed(fileId, fileName, size);

    res.json({
      method: 'Indexed Allocation',
      ...result,
      fileSystemState: fileSystemManager.getFileSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/files/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;

    const result = fileSystemManager.deleteFile(fileId);

    res.json({
      ...result,
      fileSystemState: fileSystemManager.getFileSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file system state
router.get('/state', (req, res) => {
  try {
    const state = fileSystemManager.getFileSystemState();
    const fragmentation = fileSystemManager.calculateFragmentation();

    res.json({
      ...state,
      fragmentation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset file system
router.post('/reset', (req, res) => {
  try {
    fileSystemManager.reset();

    res.json({
      message: 'File system reset',
      fileSystemState: fileSystemManager.getFileSystemState()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare allocation methods
router.post('/compare', (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    const results = fileSystemManager.compareAllocationMethods(files);

    res.json({
      files,
      comparison: results,
      configuration: {
        totalBlocks: fileSystemManager.totalBlocks,
        blockSize: fileSystemManager.blockSize
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disk Scheduling Routes

// Initialize disk scheduler
router.post('/disk/initialize', (req, res) => {
  try {
    const { totalTracks = 200, currentHead = 100 } = req.body;

    if (totalTracks <= 0) {
      return res.status(400).json({ error: 'Total tracks must be greater than 0' });
    }

    if (currentHead < 0 || currentHead >= totalTracks) {
      return res.status(400).json({ error: `Current head must be between 0 and ${totalTracks - 1}` });
    }

    diskScheduler = new DiskScheduler(totalTracks, currentHead);

    res.json({
      message: 'Disk scheduler initialized',
      configuration: {
        totalTracks,
        currentHead
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get disk scheduling algorithms
router.get('/disk/algorithms', (req, res) => {
  res.json({
    algorithms: [
      {
        id: 'fcfs',
        name: 'First Come First Serve',
        description: 'Services requests in order of arrival'
      },
      {
        id: 'sstf',
        name: 'Shortest Seek Time First',
        description: 'Services the request closest to current head position'
      },
      {
        id: 'scan',
        name: 'SCAN (Elevator)',
        description: 'Services requests in one direction, then reverses'
      },
      {
        id: 'cscan',
        name: 'C-SCAN (Circular SCAN)',
        description: 'Services requests in one direction, then jumps to opposite end'
      },
      {
        id: 'look',
        name: 'LOOK',
        description: 'Like SCAN but only goes as far as the last request'
      }
    ]
  });
});

// Add disk requests
router.post('/disk/requests', (req, res) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Requests array is required' });
    }

    diskScheduler.reset();

    requests.forEach((request, index) => {
      const { trackNumber, processId = `P${index + 1}` } = request;

      if (trackNumber === undefined) {
        throw new Error('Track number is required for each request');
      }

      diskScheduler.addRequest(trackNumber, processId);
    });

    res.json({
      message: 'Disk requests added successfully',
      requestCount: requests.length,
      requests: diskScheduler.requests
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Execute FCFS disk scheduling
router.post('/disk/schedule/fcfs', (req, res) => {
  try {
    if (diskScheduler.requests.length === 0) {
      return res.status(400).json({ error: 'No disk requests added' });
    }

    const result = diskScheduler.fcfs();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute SSTF disk scheduling
router.post('/disk/schedule/sstf', (req, res) => {
  try {
    if (diskScheduler.requests.length === 0) {
      return res.status(400).json({ error: 'No disk requests added' });
    }

    const result = diskScheduler.sstf();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute SCAN disk scheduling
router.post('/disk/schedule/scan', (req, res) => {
  try {
    if (diskScheduler.requests.length === 0) {
      return res.status(400).json({ error: 'No disk requests added' });
    }

    const { direction = 'up' } = req.body;

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "up" or "down"' });
    }

    const result = diskScheduler.scan(direction);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute C-SCAN disk scheduling
router.post('/disk/schedule/cscan', (req, res) => {
  try {
    if (diskScheduler.requests.length === 0) {
      return res.status(400).json({ error: 'No disk requests added' });
    }

    const { direction = 'up' } = req.body;

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "up" or "down"' });
    }

    const result = diskScheduler.cscan(direction);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute LOOK disk scheduling
router.post('/disk/schedule/look', (req, res) => {
  try {
    if (diskScheduler.requests.length === 0) {
      return res.status(400).json({ error: 'No disk requests added' });
    }

    const { direction = 'up' } = req.body;

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be "up" or "down"' });
    }

    const result = diskScheduler.look(direction);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare disk scheduling algorithms
router.post('/disk/compare', (req, res) => {
  try {
    if (diskScheduler.requests.length === 0) {
      return res.status(400).json({ error: 'No disk requests added' });
    }

    const { direction = 'up' } = req.body;
    const algorithms = ['fcfs', 'sstf', 'scan', 'cscan', 'look'];
    const results = {};

    algorithms.forEach(algorithm => {
      // Create fresh disk scheduler for each algorithm
      const tempScheduler = new DiskScheduler(diskScheduler.totalTracks, diskScheduler.initialHead);

      // Add same requests
      diskScheduler.requests.forEach(req => {
        tempScheduler.addRequest(req.trackNumber, req.processId);
      });

      let result;
      switch (algorithm) {
        case 'fcfs':
          result = tempScheduler.fcfs();
          break;
        case 'sstf':
          result = tempScheduler.sstf();
          break;
        case 'scan':
          result = tempScheduler.scan(direction);
          break;
        case 'cscan':
          result = tempScheduler.cscan(direction);
          break;
        case 'look':
          result = tempScheduler.look(direction);
          break;
      }

      results[algorithm] = {
        algorithm: result.algorithm,
        totalSeekTime: result.totalSeekTime,
        averageSeekTime: result.averageSeekTime,
        totalWaitTime: result.totalWaitTime,
        averageWaitTime: result.averageWaitTime
      };
    });

    res.json({
      comparison: results,
      direction,
      configuration: {
        totalTracks: diskScheduler.totalTracks,
        initialHead: diskScheduler.initialHead,
        totalRequests: diskScheduler.requests.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;