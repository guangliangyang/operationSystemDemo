class Resource {
  constructor(id, name, totalInstances = 1) {
    this.id = id;
    this.name = name;
    this.totalInstances = totalInstances;
    this.availableInstances = totalInstances;
    this.allocation = new Map(); // processId -> instances allocated
    this.requests = new Map(); // processId -> instances requested
  }

  allocate(processId, instances) {
    if (instances > this.availableInstances) {
      return false;
    }

    this.availableInstances -= instances;
    const currentAllocation = this.allocation.get(processId) || 0;
    this.allocation.set(processId, currentAllocation + instances);
    return true;
  }

  release(processId, instances) {
    const currentAllocation = this.allocation.get(processId) || 0;
    if (instances > currentAllocation) {
      return false;
    }

    this.availableInstances += instances;
    const newAllocation = currentAllocation - instances;
    if (newAllocation === 0) {
      this.allocation.delete(processId);
    } else {
      this.allocation.set(processId, newAllocation);
    }
    return true;
  }

  request(processId, instances) {
    this.requests.set(processId, instances);
  }

  clearRequest(processId) {
    this.requests.delete(processId);
  }

  getAllocated(processId) {
    return this.allocation.get(processId) || 0;
  }

  getRequested(processId) {
    return this.requests.get(processId) || 0;
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      totalInstances: this.totalInstances,
      availableInstances: this.availableInstances,
      allocation: Object.fromEntries(this.allocation),
      requests: Object.fromEntries(this.requests)
    };
  }
}

class DeadlockDetector {
  constructor() {
    this.processes = new Set();
    this.resources = new Map();
    this.history = [];
    this.currentTime = 0;
  }

  addResource(resourceId, name, totalInstances = 1) {
    const resource = new Resource(resourceId, name, totalInstances);
    this.resources.set(resourceId, resource);

    this.history.push({
      time: this.currentTime++,
      event: 'resource_added',
      resourceId,
      name,
      totalInstances,
      message: `Added resource ${name} (${resourceId}) with ${totalInstances} instances`
    });

    return resource;
  }

  addProcess(processId) {
    this.processes.add(processId);

    this.history.push({
      time: this.currentTime++,
      event: 'process_added',
      processId,
      message: `Added process ${processId}`
    });
  }

  requestResource(processId, resourceId, instances = 1) {
    if (!this.processes.has(processId)) {
      this.addProcess(processId);
    }

    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    resource.request(processId, instances);

    this.history.push({
      time: this.currentTime++,
      event: 'resource_requested',
      processId,
      resourceId,
      instances,
      message: `Process ${processId} requested ${instances} instances of resource ${resourceId}`
    });

    // Try to satisfy the request immediately
    if (resource.availableInstances >= instances) {
      return this.allocateResource(processId, resourceId, instances);
    }

    return {
      success: false,
      blocked: true,
      message: `Process ${processId} blocked waiting for ${instances} instances of resource ${resourceId}`
    };
  }

  allocateResource(processId, resourceId, instances = 1) {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    if (resource.allocate(processId, instances)) {
      resource.clearRequest(processId);

      this.history.push({
        time: this.currentTime++,
        event: 'resource_allocated',
        processId,
        resourceId,
        instances,
        message: `Allocated ${instances} instances of resource ${resourceId} to process ${processId}`
      });

      return {
        success: true,
        allocated: true,
        message: `Process ${processId} successfully allocated ${instances} instances of resource ${resourceId}`
      };
    }

    return {
      success: false,
      message: `Cannot allocate ${instances} instances of resource ${resourceId} to process ${processId}`
    };
  }

  releaseResource(processId, resourceId, instances = 1) {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    if (resource.release(processId, instances)) {
      this.history.push({
        time: this.currentTime++,
        event: 'resource_released',
        processId,
        resourceId,
        instances,
        message: `Process ${processId} released ${instances} instances of resource ${resourceId}`
      });

      // Try to satisfy pending requests
      this.tryToSatisfyPendingRequests();

      return {
        success: true,
        message: `Process ${processId} successfully released ${instances} instances of resource ${resourceId}`
      };
    }

    return {
      success: false,
      message: `Process ${processId} cannot release ${instances} instances of resource ${resourceId}`
    };
  }

  tryToSatisfyPendingRequests() {
    for (const [resourceId, resource] of this.resources) {
      for (const [processId, requestedInstances] of resource.requests) {
        if (resource.availableInstances >= requestedInstances) {
          this.allocateResource(processId, resourceId, requestedInstances);
        }
      }
    }
  }

  // Banker's Algorithm - Check if system is in safe state
  isSafeState() {
    const processes = Array.from(this.processes);
    const resources = Array.from(this.resources.keys());

    // Build allocation and need matrices
    const allocation = {};
    const need = {};
    const available = {};

    // Initialize available resources
    for (const resourceId of resources) {
      const resource = this.resources.get(resourceId);
      available[resourceId] = resource.availableInstances;
    }

    // Build allocation and need matrices
    for (const processId of processes) {
      allocation[processId] = {};
      need[processId] = {};

      for (const resourceId of resources) {
        const resource = this.resources.get(resourceId);
        allocation[processId][resourceId] = resource.getAllocated(processId);
        need[processId][resourceId] = resource.getRequested(processId);
      }
    }

    // Safety algorithm
    const work = { ...available };
    const finish = {};
    const safeSequence = [];

    // Initialize finish array
    for (const processId of processes) {
      finish[processId] = false;
    }

    let progress = true;
    while (progress && safeSequence.length < processes.length) {
      progress = false;

      for (const processId of processes) {
        if (finish[processId]) continue;

        // Check if process can finish with current resources
        let canFinish = true;
        for (const resourceId of resources) {
          if (need[processId][resourceId] > work[resourceId]) {
            canFinish = false;
            break;
          }
        }

        if (canFinish) {
          // Process can finish, release its resources
          for (const resourceId of resources) {
            work[resourceId] += allocation[processId][resourceId];
          }
          finish[processId] = true;
          safeSequence.push(processId);
          progress = true;
        }
      }
    }

    const isSafe = safeSequence.length === processes.length;

    return {
      isSafe,
      safeSequence: isSafe ? safeSequence : null,
      deadlockedProcesses: isSafe ? [] : processes.filter(p => !finish[p]),
      allocation,
      need,
      available,
      work
    };
  }

  // Detect deadlock using Resource Allocation Graph
  detectDeadlockRAG() {
    const graph = this.buildResourceAllocationGraph();
    const cycles = this.findCycles(graph);

    return {
      hasDeadlock: cycles.length > 0,
      cycles,
      graph,
      deadlockedProcesses: cycles.length > 0 ?
        [...new Set(cycles.flat().filter(node => node.startsWith('P')))] : []
    };
  }

  buildResourceAllocationGraph() {
    const graph = {
      nodes: [],
      edges: []
    };

    // Add process nodes
    for (const processId of this.processes) {
      graph.nodes.push({ id: processId, type: 'process' });
    }

    // Add resource nodes
    for (const [resourceId, resource] of this.resources) {
      graph.nodes.push({ id: resourceId, type: 'resource', instances: resource.totalInstances });
    }

    // Add allocation edges (resource -> process)
    for (const [resourceId, resource] of this.resources) {
      for (const [processId, instances] of resource.allocation) {
        for (let i = 0; i < instances; i++) {
          graph.edges.push({
            from: resourceId,
            to: processId,
            type: 'allocation'
          });
        }
      }
    }

    // Add request edges (process -> resource)
    for (const [resourceId, resource] of this.resources) {
      for (const [processId, instances] of resource.requests) {
        for (let i = 0; i < instances; i++) {
          graph.edges.push({
            from: processId,
            to: resourceId,
            type: 'request'
          });
        }
      }
    }

    return graph;
  }

  findCycles(graph) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId, path) => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart);
        cycles.push([...cycle, nodeId]);
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Find outgoing edges
      const outgoingEdges = graph.edges.filter(edge => edge.from === nodeId);
      for (const edge of outgoingEdges) {
        dfs(edge.to, [...path, nodeId]);
      }

      recursionStack.delete(nodeId);
    };

    // Start DFS from each unvisited node
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return cycles;
  }

  // Deadlock prevention - Check if request can be granted safely
  canGrantRequestSafely(processId, resourceId, instances) {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return { canGrant: false, reason: 'Resource not found' };
    }

    if (resource.availableInstances < instances) {
      return { canGrant: false, reason: 'Not enough available instances' };
    }

    // Temporarily grant the request
    const originalAvailable = resource.availableInstances;
    const originalAllocation = resource.getAllocated(processId);
    resource.allocate(processId, instances);

    // Check if system remains in safe state
    const safetyCheck = this.isSafeState();

    // Rollback the temporary allocation
    resource.release(processId, instances);

    return {
      canGrant: safetyCheck.isSafe,
      reason: safetyCheck.isSafe ? 'Request can be granted safely' : 'Request would lead to unsafe state',
      safetyCheck
    };
  }

  getSystemState() {
    const resourceStates = {};
    for (const [resourceId, resource] of this.resources) {
      resourceStates[resourceId] = resource.getState();
    }

    return {
      processes: Array.from(this.processes),
      resources: resourceStates,
      currentTime: this.currentTime,
      history: this.history
    };
  }

  reset() {
    this.processes.clear();
    this.resources.clear();
    this.history = [];
    this.currentTime = 0;
  }

  // Simulate a classic deadlock scenario
  simulateDeadlockScenario() {
    this.reset();

    // Create resources
    this.addResource('R1', 'Printer', 1);
    this.addResource('R2', 'Scanner', 1);

    // Create processes
    this.addProcess('P1');
    this.addProcess('P2');

    const simulation = [];

    // Step 1: P1 requests and gets R1
    this.requestResource('P1', 'R1', 1);
    simulation.push({
      step: 1,
      action: 'P1 requests and gets R1',
      state: this.getSystemState(),
      deadlockCheck: this.detectDeadlockRAG()
    });

    // Step 2: P2 requests and gets R2
    this.requestResource('P2', 'R2', 1);
    simulation.push({
      step: 2,
      action: 'P2 requests and gets R2',
      state: this.getSystemState(),
      deadlockCheck: this.detectDeadlockRAG()
    });

    // Step 3: P1 requests R2 (will be blocked)
    this.requestResource('P1', 'R2', 1);
    simulation.push({
      step: 3,
      action: 'P1 requests R2 (blocked)',
      state: this.getSystemState(),
      deadlockCheck: this.detectDeadlockRAG()
    });

    // Step 4: P2 requests R1 (deadlock!)
    this.requestResource('P2', 'R1', 1);
    simulation.push({
      step: 4,
      action: 'P2 requests R1 (DEADLOCK!)',
      state: this.getSystemState(),
      deadlockCheck: this.detectDeadlockRAG()
    });

    return {
      scenario: 'Classic Deadlock Scenario',
      simulation,
      finalDeadlockCheck: this.detectDeadlockRAG(),
      finalSafetyCheck: this.isSafeState()
    };
  }
}

module.exports = { DeadlockDetector, Resource };