class FileBlock {
  constructor(blockNumber, isAllocated = false, fileId = null, nextBlock = null) {
    this.blockNumber = blockNumber;
    this.isAllocated = isAllocated;
    this.fileId = fileId;
    this.nextBlock = nextBlock; // For linked allocation
  }
}

class File {
  constructor(fileId, name, size, allocationMethod = 'contiguous') {
    this.fileId = fileId;
    this.name = name;
    this.size = size;
    this.allocationMethod = allocationMethod;
    this.startBlock = null;
    this.blocks = [];
    this.indexBlock = null; // For indexed allocation
    this.createdAt = new Date();
  }
}

class FileSystemManager {
  constructor(totalBlocks = 20, blockSize = 1) {
    this.totalBlocks = totalBlocks;
    this.blockSize = blockSize; // KB
    this.blocks = [];
    this.files = new Map();
    this.freeBlocksList = [];
    this.allocationHistory = [];

    this.initializeBlocks();
  }

  initializeBlocks() {
    for (let i = 0; i < this.totalBlocks; i++) {
      this.blocks.push(new FileBlock(i));
      this.freeBlocksList.push(i);
    }
  }

  reset() {
    this.blocks = [];
    this.files.clear();
    this.freeBlocksList = [];
    this.allocationHistory = [];
    this.initializeBlocks();
  }

  // Contiguous Allocation
  allocateContiguous(fileId, fileName, size) {
    const blocksNeeded = Math.ceil(size / this.blockSize);

    // Find contiguous free space
    let startBlock = -1;
    let consecutiveBlocks = 0;

    for (let i = 0; i < this.totalBlocks; i++) {
      if (!this.blocks[i].isAllocated) {
        if (consecutiveBlocks === 0) {
          startBlock = i;
        }
        consecutiveBlocks++;

        if (consecutiveBlocks >= blocksNeeded) {
          break;
        }
      } else {
        consecutiveBlocks = 0;
        startBlock = -1;
      }
    }

    if (consecutiveBlocks < blocksNeeded) {
      this.allocationHistory.push({
        action: 'allocate',
        method: 'contiguous',
        fileId,
        fileName,
        size,
        success: false,
        reason: 'No contiguous space available',
        timestamp: Date.now()
      });
      return { success: false, reason: 'No contiguous space available' };
    }

    // Allocate blocks
    const file = new File(fileId, fileName, size, 'contiguous');
    file.startBlock = startBlock;

    for (let i = startBlock; i < startBlock + blocksNeeded; i++) {
      this.blocks[i].isAllocated = true;
      this.blocks[i].fileId = fileId;
      file.blocks.push(i);
      this.freeBlocksList.splice(this.freeBlocksList.indexOf(i), 1);
    }

    this.files.set(fileId, file);

    this.allocationHistory.push({
      action: 'allocate',
      method: 'contiguous',
      fileId,
      fileName,
      size,
      startBlock,
      blocksUsed: blocksNeeded,
      success: true,
      timestamp: Date.now()
    });

    return {
      success: true,
      startBlock,
      blocksUsed: blocksNeeded,
      blocks: file.blocks
    };
  }

  // Linked Allocation
  allocateLinked(fileId, fileName, size) {
    const blocksNeeded = Math.ceil(size / this.blockSize);

    if (this.freeBlocksList.length < blocksNeeded) {
      this.allocationHistory.push({
        action: 'allocate',
        method: 'linked',
        fileId,
        fileName,
        size,
        success: false,
        reason: 'Not enough free blocks',
        timestamp: Date.now()
      });
      return { success: false, reason: 'Not enough free blocks' };
    }

    const file = new File(fileId, fileName, size, 'linked');
    const allocatedBlocks = [];

    // Allocate first block
    let currentBlock = this.freeBlocksList[0];
    file.startBlock = currentBlock;
    allocatedBlocks.push(currentBlock);

    this.blocks[currentBlock].isAllocated = true;
    this.blocks[currentBlock].fileId = fileId;
    this.freeBlocksList.splice(0, 1);

    // Allocate remaining blocks and link them
    for (let i = 1; i < blocksNeeded; i++) {
      const nextBlock = this.freeBlocksList[0];
      allocatedBlocks.push(nextBlock);

      this.blocks[currentBlock].nextBlock = nextBlock;
      this.blocks[nextBlock].isAllocated = true;
      this.blocks[nextBlock].fileId = fileId;
      this.freeBlocksList.splice(0, 1);

      currentBlock = nextBlock;
    }

    file.blocks = allocatedBlocks;
    this.files.set(fileId, file);

    this.allocationHistory.push({
      action: 'allocate',
      method: 'linked',
      fileId,
      fileName,
      size,
      startBlock: file.startBlock,
      blocksUsed: blocksNeeded,
      blocks: allocatedBlocks,
      success: true,
      timestamp: Date.now()
    });

    return {
      success: true,
      startBlock: file.startBlock,
      blocksUsed: blocksNeeded,
      blocks: allocatedBlocks
    };
  }

  // Indexed Allocation
  allocateIndexed(fileId, fileName, size) {
    const blocksNeeded = Math.ceil(size / this.blockSize);

    // Need one extra block for index
    if (this.freeBlocksList.length < blocksNeeded + 1) {
      this.allocationHistory.push({
        action: 'allocate',
        method: 'indexed',
        fileId,
        fileName,
        size,
        success: false,
        reason: 'Not enough free blocks (including index block)',
        timestamp: Date.now()
      });
      return { success: false, reason: 'Not enough free blocks (including index block)' };
    }

    const file = new File(fileId, fileName, size, 'indexed');

    // Allocate index block
    const indexBlock = this.freeBlocksList[0];
    file.indexBlock = indexBlock;
    this.blocks[indexBlock].isAllocated = true;
    this.blocks[indexBlock].fileId = fileId + '_index';
    this.freeBlocksList.splice(0, 1);

    // Allocate data blocks
    const allocatedBlocks = [];
    for (let i = 0; i < blocksNeeded; i++) {
      const dataBlock = this.freeBlocksList[0];
      allocatedBlocks.push(dataBlock);

      this.blocks[dataBlock].isAllocated = true;
      this.blocks[dataBlock].fileId = fileId;
      this.freeBlocksList.splice(0, 1);
    }

    file.blocks = allocatedBlocks;
    this.files.set(fileId, file);

    this.allocationHistory.push({
      action: 'allocate',
      method: 'indexed',
      fileId,
      fileName,
      size,
      indexBlock,
      blocksUsed: blocksNeeded,
      blocks: allocatedBlocks,
      success: true,
      timestamp: Date.now()
    });

    return {
      success: true,
      indexBlock,
      blocksUsed: blocksNeeded,
      blocks: allocatedBlocks
    };
  }

  // Delete file
  deleteFile(fileId) {
    if (!this.files.has(fileId)) {
      return { success: false, reason: 'File not found' };
    }

    const file = this.files.get(fileId);
    const freedBlocks = [];

    // Free data blocks
    file.blocks.forEach(blockNum => {
      this.blocks[blockNum].isAllocated = false;
      this.blocks[blockNum].fileId = null;
      this.blocks[blockNum].nextBlock = null;
      this.freeBlocksList.push(blockNum);
      freedBlocks.push(blockNum);
    });

    // Free index block if indexed allocation
    if (file.allocationMethod === 'indexed' && file.indexBlock !== null) {
      this.blocks[file.indexBlock].isAllocated = false;
      this.blocks[file.indexBlock].fileId = null;
      this.freeBlocksList.push(file.indexBlock);
      freedBlocks.push(file.indexBlock);
    }

    // Sort free blocks list
    this.freeBlocksList.sort((a, b) => a - b);

    this.files.delete(fileId);

    this.allocationHistory.push({
      action: 'delete',
      fileId,
      fileName: file.name,
      method: file.allocationMethod,
      freedBlocks,
      success: true,
      timestamp: Date.now()
    });

    return { success: true, freedBlocks };
  }

  // Get file system state
  getFileSystemState() {
    const allocatedBlocks = this.blocks.filter(block => block.isAllocated).length;
    const freeBlocks = this.totalBlocks - allocatedBlocks;
    const utilizationPercentage = (allocatedBlocks / this.totalBlocks) * 100;

    return {
      blocks: this.blocks.map(block => ({
        blockNumber: block.blockNumber,
        isAllocated: block.isAllocated,
        fileId: block.fileId,
        nextBlock: block.nextBlock
      })),
      files: Array.from(this.files.values()).map(file => ({
        fileId: file.fileId,
        name: file.name,
        size: file.size,
        allocationMethod: file.allocationMethod,
        startBlock: file.startBlock,
        indexBlock: file.indexBlock,
        blocks: file.blocks,
        createdAt: file.createdAt
      })),
      summary: {
        totalBlocks: this.totalBlocks,
        blockSize: this.blockSize,
        allocatedBlocks,
        freeBlocks,
        utilizationPercentage,
        numberOfFiles: this.files.size,
        freeBlocksList: [...this.freeBlocksList].sort((a, b) => a - b)
      },
      history: this.allocationHistory
    };
  }

  // Calculate fragmentation
  calculateFragmentation() {
    const freeBlocks = this.freeBlocksList.length;
    if (freeBlocks <= 1) return 0;

    // Count fragmented free space (non-contiguous free blocks)
    const sortedFreeBlocks = [...this.freeBlocksList].sort((a, b) => a - b);
    let fragments = 0;
    let consecutiveBlocks = 1;

    for (let i = 1; i < sortedFreeBlocks.length; i++) {
      if (sortedFreeBlocks[i] === sortedFreeBlocks[i - 1] + 1) {
        consecutiveBlocks++;
      } else {
        fragments++;
        consecutiveBlocks = 1;
      }
    }

    if (consecutiveBlocks > 0) {
      fragments++;
    }

    return {
      totalFreeBlocks: freeBlocks,
      fragments,
      averageFragmentSize: freeBlocks / fragments,
      fragmentationRatio: fragments / freeBlocks
    };
  }

  // Compare allocation methods
  compareAllocationMethods(files) {
    const results = {};
    const methods = ['contiguous', 'linked', 'indexed'];

    methods.forEach(method => {
      // Create fresh file system for each method
      const tempFS = new FileSystemManager(this.totalBlocks, this.blockSize);
      const allocationResults = [];
      let successfulAllocations = 0;
      let failedAllocations = 0;

      files.forEach(file => {
        let result;
        switch (method) {
          case 'contiguous':
            result = tempFS.allocateContiguous(file.fileId, file.name, file.size);
            break;
          case 'linked':
            result = tempFS.allocateLinked(file.fileId, file.name, file.size);
            break;
          case 'indexed':
            result = tempFS.allocateIndexed(file.fileId, file.name, file.size);
            break;
        }

        allocationResults.push({
          fileId: file.fileId,
          name: file.name,
          size: file.size,
          success: result.success,
          blocks: result.blocks || []
        });

        if (result.success) {
          successfulAllocations++;
        } else {
          failedAllocations++;
        }
      });

      const finalState = tempFS.getFileSystemState();
      const fragmentation = tempFS.calculateFragmentation();

      results[method] = {
        method: method.charAt(0).toUpperCase() + method.slice(1),
        successfulAllocations,
        failedAllocations,
        utilizationPercentage: finalState.summary.utilizationPercentage,
        fragmentation,
        allocationResults,
        finalState
      };
    });

    return results;
  }
}

module.exports = { FileSystemManager, File, FileBlock };