class MemoryBlock {
  constructor(startAddress, size, isAllocated = false, processId = null) {
    this.startAddress = startAddress;
    this.size = size;
    this.isAllocated = isAllocated;
    this.processId = processId;
    this.endAddress = startAddress + size - 1;
  }
}

class MemoryManager {
  constructor(totalMemory = 1024) {
    this.totalMemory = totalMemory;
    this.blocks = [new MemoryBlock(0, totalMemory, false)];
    this.allocatedProcesses = new Map();
    this.history = [];
  }

  reset() {
    this.blocks = [new MemoryBlock(0, this.totalMemory, false)];
    this.allocatedProcesses.clear();
    this.history = [];
  }

  // First Fit allocation
  firstFit(processId, size) {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      if (!block.isAllocated && block.size >= size) {
        // Allocate memory
        this.allocateBlock(i, processId, size);
        this.history.push({
          action: 'allocate',
          algorithm: 'First Fit',
          processId,
          size,
          startAddress: block.startAddress,
          success: true,
          timestamp: Date.now()
        });
        return { success: true, startAddress: block.startAddress };
      }
    }

    this.history.push({
      action: 'allocate',
      algorithm: 'First Fit',
      processId,
      size,
      success: false,
      reason: 'No suitable block found',
      timestamp: Date.now()
    });
    return { success: false, reason: 'No suitable block found' };
  }

  // Best Fit allocation
  bestFit(processId, size) {
    let bestBlockIndex = -1;
    let bestBlockSize = Infinity;

    // Find the smallest suitable block
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      if (!block.isAllocated && block.size >= size && block.size < bestBlockSize) {
        bestBlockIndex = i;
        bestBlockSize = block.size;
      }
    }

    if (bestBlockIndex === -1) {
      this.history.push({
        action: 'allocate',
        algorithm: 'Best Fit',
        processId,
        size,
        success: false,
        reason: 'No suitable block found',
        timestamp: Date.now()
      });
      return { success: false, reason: 'No suitable block found' };
    }

    const block = this.blocks[bestBlockIndex];
    this.allocateBlock(bestBlockIndex, processId, size);
    this.history.push({
      action: 'allocate',
      algorithm: 'Best Fit',
      processId,
      size,
      startAddress: block.startAddress,
      success: true,
      timestamp: Date.now()
    });
    return { success: true, startAddress: block.startAddress };
  }

  // Worst Fit allocation
  worstFit(processId, size) {
    let worstBlockIndex = -1;
    let worstBlockSize = -1;

    // Find the largest suitable block
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      if (!block.isAllocated && block.size >= size && block.size > worstBlockSize) {
        worstBlockIndex = i;
        worstBlockSize = block.size;
      }
    }

    if (worstBlockIndex === -1) {
      this.history.push({
        action: 'allocate',
        algorithm: 'Worst Fit',
        processId,
        size,
        success: false,
        reason: 'No suitable block found',
        timestamp: Date.now()
      });
      return { success: false, reason: 'No suitable block found' };
    }

    const block = this.blocks[worstBlockIndex];
    this.allocateBlock(worstBlockIndex, processId, size);
    this.history.push({
      action: 'allocate',
      algorithm: 'Worst Fit',
      processId,
      size,
      startAddress: block.startAddress,
      success: true,
      timestamp: Date.now()
    });
    return { success: true, startAddress: block.startAddress };
  }

  // Helper method to allocate a block
  allocateBlock(blockIndex, processId, size) {
    const block = this.blocks[blockIndex];

    if (block.size === size) {
      // Exact fit - just mark as allocated
      block.isAllocated = true;
      block.processId = processId;
    } else {
      // Split the block
      const newBlock = new MemoryBlock(block.startAddress, size, true, processId);
      const remainingBlock = new MemoryBlock(
        block.startAddress + size,
        block.size - size,
        false
      );

      this.blocks.splice(blockIndex, 1, newBlock, remainingBlock);
    }

    this.allocatedProcesses.set(processId, {
      startAddress: block.startAddress,
      size: size
    });
  }

  // Deallocate memory
  deallocate(processId) {
    if (!this.allocatedProcesses.has(processId)) {
      this.history.push({
        action: 'deallocate',
        processId,
        success: false,
        reason: 'Process not found',
        timestamp: Date.now()
      });
      return { success: false, reason: 'Process not found' };
    }

    const processInfo = this.allocatedProcesses.get(processId);

    // Find and deallocate the block
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      if (block.isAllocated && block.processId === processId) {
        block.isAllocated = false;
        block.processId = null;

        // Merge with adjacent free blocks
        this.mergeBlocks();

        this.allocatedProcesses.delete(processId);
        this.history.push({
          action: 'deallocate',
          processId,
          startAddress: processInfo.startAddress,
          size: processInfo.size,
          success: true,
          timestamp: Date.now()
        });
        return { success: true };
      }
    }

    return { success: false, reason: 'Block not found' };
  }

  // Merge adjacent free blocks
  mergeBlocks() {
    for (let i = 0; i < this.blocks.length - 1; i++) {
      const currentBlock = this.blocks[i];
      const nextBlock = this.blocks[i + 1];

      if (!currentBlock.isAllocated && !nextBlock.isAllocated &&
          currentBlock.endAddress + 1 === nextBlock.startAddress) {
        // Merge blocks
        currentBlock.size += nextBlock.size;
        currentBlock.endAddress = currentBlock.startAddress + currentBlock.size - 1;
        this.blocks.splice(i + 1, 1);
        i--; // Check the same position again
      }
    }
  }

  // Get memory state
  getMemoryState() {
    const freeBlocks = this.blocks.filter(block => !block.isAllocated);
    const allocatedBlocks = this.blocks.filter(block => block.isAllocated);

    const totalFree = freeBlocks.reduce((sum, block) => sum + block.size, 0);
    const totalAllocated = allocatedBlocks.reduce((sum, block) => sum + block.size, 0);
    const fragmentation = this.calculateFragmentation();

    return {
      blocks: this.blocks.map(block => ({
        startAddress: block.startAddress,
        endAddress: block.endAddress,
        size: block.size,
        isAllocated: block.isAllocated,
        processId: block.processId
      })),
      summary: {
        totalMemory: this.totalMemory,
        totalFree,
        totalAllocated,
        utilizationPercentage: (totalAllocated / this.totalMemory) * 100,
        fragmentationPercentage: fragmentation,
        numberOfFreeBlocks: freeBlocks.length,
        numberOfAllocatedBlocks: allocatedBlocks.length,
        largestFreeBlock: freeBlocks.length > 0 ? Math.max(...freeBlocks.map(b => b.size)) : 0
      },
      allocatedProcesses: Array.from(this.allocatedProcesses.entries()).map(([processId, info]) => ({
        processId,
        ...info
      })),
      history: this.history
    };
  }

  // Calculate fragmentation percentage
  calculateFragmentation() {
    const freeBlocks = this.blocks.filter(block => !block.isAllocated);
    if (freeBlocks.length <= 1) return 0;

    const totalFree = freeBlocks.reduce((sum, block) => sum + block.size, 0);
    const largestFree = Math.max(...freeBlocks.map(block => block.size));

    if (totalFree === 0) return 0;

    return ((totalFree - largestFree) / totalFree) * 100;
  }

  // Compact memory (defragmentation)
  compact() {
    const allocatedBlocks = this.blocks.filter(block => block.isAllocated);
    const totalAllocated = allocatedBlocks.reduce((sum, block) => sum + block.size, 0);
    const totalFree = this.totalMemory - totalAllocated;

    // Create new memory layout
    this.blocks = [];
    let currentAddress = 0;

    // Add all allocated blocks first
    allocatedBlocks.forEach(block => {
      const newBlock = new MemoryBlock(currentAddress, block.size, true, block.processId);
      this.blocks.push(newBlock);

      // Update process info
      this.allocatedProcesses.set(block.processId, {
        startAddress: currentAddress,
        size: block.size
      });

      currentAddress += block.size;
    });

    // Add remaining free space as one block
    if (totalFree > 0) {
      this.blocks.push(new MemoryBlock(currentAddress, totalFree, false));
    }

    this.history.push({
      action: 'compact',
      success: true,
      timestamp: Date.now()
    });

    return { success: true, message: 'Memory compacted successfully' };
  }
}

module.exports = { MemoryManager, MemoryBlock };