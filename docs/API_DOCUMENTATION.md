# Operating System Demo - API Documentation

## 🌐 Base URL
```
http://localhost:3001
```

## 📋 API Overview

The Operating System Demo provides comprehensive RESTful APIs covering all major operating system concepts. All endpoints return JSON responses and support standard HTTP methods.

### Available Modules
- **Process Scheduling** - CPU scheduling algorithms and process management
- **Memory Management** - Memory allocation and virtual memory systems
- **File Systems** - File allocation methods and disk scheduling
- **I/O Management** - Device scheduling and interrupt handling
- **Synchronization** - Semaphores, mutexes, and monitors
- **Deadlock** - Detection, prevention, and avoidance algorithms
- **Multilevel Queue** - Advanced scheduling with multiple queues
- **Advanced Memory** - Segmentation, paging, and garbage collection
- **Real-Time** - Real-time scheduling algorithms and analysis

---

## 🔄 Process Scheduling APIs

### GET `/api/processes/algorithms`
Get available scheduling algorithms and their descriptions.

**Response:**
```json
{
  "algorithms": [
    {
      "name": "FCFS",
      "description": "First Come First Served scheduling"
    },
    {
      "name": "SJF",
      "description": "Shortest Job First scheduling"
    }
  ]
}
```

### POST `/api/processes/simulate`
Run process scheduling simulation.

**Request Body:**
```json
{
  "algorithm": "RoundRobin",
  "timeQuantum": 4,
  "processes": [
    {
      "id": "P1",
      "arrivalTime": 0,
      "burstTime": 10,
      "priority": 1
    }
  ]
}
```

**Response:**
```json
{
  "algorithm": "RoundRobin",
  "ganttChart": [...],
  "metrics": {
    "averageWaitTime": 5.5,
    "averageTurnaroundTime": 8.2,
    "throughput": 0.8
  }
}
```

---

## 💾 Memory Management APIs

### GET `/api/memory/algorithms`
Get available memory allocation algorithms.

### POST `/api/memory/allocate`
Allocate memory using specified algorithm.

**Request Body:**
```json
{
  "algorithm": "BestFit",
  "processId": "P1",
  "size": 256
}
```

### POST `/api/memory/deallocate`
Deallocate memory for a process.

**Request Body:**
```json
{
  "processId": "P1"
}
```

### GET `/api/memory/state`
Get current memory state and statistics.

---

## 📁 File System APIs

### GET `/api/filesystem/allocation-methods`
Get available file allocation methods.

### POST `/api/filesystem/allocate`
Allocate disk space for a file.

**Request Body:**
```json
{
  "method": "Indexed",
  "filename": "document.txt",
  "size": 1024
}
```

### POST `/api/filesystem/disk-schedule`
Schedule disk I/O requests.

**Request Body:**
```json
{
  "algorithm": "SCAN",
  "requests": [98, 183, 37, 122, 14, 124, 65, 67],
  "currentPosition": 53,
  "direction": "up"
}
```

---

## 🔄 Synchronization APIs

### GET `/api/synchronization/primitives`
Get available synchronization primitives.

### POST `/api/synchronization/semaphore/create`
Create a new semaphore.

**Request Body:**
```json
{
  "name": "resource_sem",
  "initialValue": 3
}
```

### POST `/api/synchronization/semaphore/:name/wait`
Perform wait operation on semaphore.

**Request Body:**
```json
{
  "processId": "P1"
}
```

### POST `/api/synchronization/semaphore/:name/signal`
Perform signal operation on semaphore.

**Request Body:**
```json
{
  "processId": "P1"
}
```

### POST `/api/synchronization/demo/producer-consumer`
Run producer-consumer simulation.

**Request Body:**
```json
{
  "bufferSize": 5,
  "producers": 2,
  "consumers": 2,
  "timeLimit": 20
}
```

---

## 🚫 Deadlock APIs

### GET `/api/deadlock/info`
Get deadlock algorithms information.

### POST `/api/deadlock/resource`
Add a new resource to the system.

**Request Body:**
```json
{
  "resourceId": "R1",
  "name": "Printer",
  "totalInstances": 2
}
```

### POST `/api/deadlock/process`
Add a new process to the system.

**Request Body:**
```json
{
  "processId": "P1"
}
```

### POST `/api/deadlock/request`
Request resource allocation.

**Request Body:**
```json
{
  "processId": "P1",
  "resourceId": "R1",
  "instances": 1
}
```

### GET `/api/deadlock/safety-check`
Check system safety using Banker's Algorithm.

### GET `/api/deadlock/deadlock-detection`
Detect deadlock using Resource Allocation Graph.

### POST `/api/deadlock/simulate`
Run classic deadlock scenario simulation.

---

## 🔄 Multilevel Queue APIs

### GET `/api/multilevel/info`
Get multilevel queue scheduling information.

### POST `/api/multilevel/queue`
Add a new queue to the scheduler.

**Request Body:**
```json
{
  "name": "Interactive",
  "priority": 1,
  "algorithm": "RoundRobin",
  "timeQuantum": 4
}
```

### POST `/api/multilevel/process`
Add a process to a specific queue.

**Request Body:**
```json
{
  "processId": "P1",
  "burstTime": 8,
  "priority": 2,
  "queueName": "Interactive"
}
```

### POST `/api/multilevel/simulate`
Run multilevel queue simulation.

### POST `/api/multilevel/demo/classic`
Run classic multilevel feedback queue demo.

---

## 🧠 Advanced Memory APIs

### GET `/api/advanced-memory/info`
Get advanced memory management information.

### POST `/api/advanced-memory/segment/create`
Create a memory segment.

**Request Body:**
```json
{
  "processId": "P1",
  "segmentName": "code",
  "size": 1024,
  "permissions": "RX"
}
```

### POST `/api/advanced-memory/page/access`
Access a virtual memory page.

**Request Body:**
```json
{
  "processId": "P1",
  "pageNumber": 5,
  "operation": "R"
}
```

### POST `/api/advanced-memory/mapping/map`
Map a file into memory.

**Request Body:**
```json
{
  "filename": "shared.dat",
  "size": 4096,
  "permissions": "RW"
}
```

### POST `/api/advanced-memory/gc/collect`
Run garbage collection.

**Request Body:**
```json
{
  "algorithm": "mark_and_sweep"
}
```

### POST `/api/advanced-memory/demo/comprehensive`
Run comprehensive memory management demo.

---

## ⏰ Real-Time Scheduling APIs

### GET `/api/realtime/info`
Get real-time scheduling algorithms information.

### POST `/api/realtime/task`
Add a real-time task.

**Request Body:**
```json
{
  "taskId": "T1",
  "executionTime": 3,
  "period": 10,
  "deadline": 8
}
```

### POST `/api/realtime/schedule/rms`
Run Rate Monotonic Scheduling.

### POST `/api/realtime/schedule/edf`
Run Earliest Deadline First scheduling.

### POST `/api/realtime/schedule/dms`
Run Deadline Monotonic Scheduling.

### POST `/api/realtime/schedule/lst`
Run Least Slack Time First scheduling.

### GET `/api/realtime/analysis/schedulability`
Perform schedulability analysis.

### POST `/api/realtime/compare`
Compare multiple real-time scheduling algorithms.

### POST `/api/realtime/demo/schedulability`
Run schedulability analysis demo.

---

## 📊 Common Response Patterns

### Success Response
```json
{
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2025-09-15T12:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": "Additional error information"
}
```

### Simulation Response
```json
{
  "algorithm": "AlgorithmName",
  "simulation": {
    "steps": [...],
    "statistics": {...},
    "ganttChart": [...]
  },
  "performance": {
    "averageWaitTime": 5.2,
    "averageTurnaroundTime": 8.7,
    "throughput": 0.85
  }
}
```

---

## 🔧 Usage Examples

### Complete Process Scheduling Example

```bash
# 1. Get available algorithms
curl -X GET http://localhost:3001/api/processes/algorithms

# 2. Run Round Robin simulation
curl -X POST http://localhost:3001/api/processes/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "RoundRobin",
    "timeQuantum": 4,
    "processes": [
      {"id": "P1", "arrivalTime": 0, "burstTime": 10, "priority": 1},
      {"id": "P2", "arrivalTime": 1, "burstTime": 6, "priority": 2},
      {"id": "P3", "arrivalTime": 2, "burstTime": 8, "priority": 1}
    ]
  }'

# 3. Compare algorithms
curl -X POST http://localhost:3001/api/processes/compare \
  -H "Content-Type: application/json" \
  -d '{
    "algorithms": ["FCFS", "SJF", "RoundRobin"],
    "processes": [...]
  }'
```

### Deadlock Detection Example

```bash
# 1. Reset system
curl -X POST http://localhost:3001/api/deadlock/reset

# 2. Add resources
curl -X POST http://localhost:3001/api/deadlock/resource \
  -H "Content-Type: application/json" \
  -d '{"resourceId": "R1", "name": "Printer", "totalInstances": 1}'

# 3. Add processes
curl -X POST http://localhost:3001/api/deadlock/process \
  -H "Content-Type: application/json" \
  -d '{"processId": "P1"}'

# 4. Request resources
curl -X POST http://localhost:3001/api/deadlock/request \
  -H "Content-Type: application/json" \
  -d '{"processId": "P1", "resourceId": "R1", "instances": 1}'

# 5. Check for deadlock
curl -X GET http://localhost:3001/api/deadlock/deadlock-detection
```

### Real-Time Scheduling Example

```bash
# 1. Add real-time tasks
curl -X POST http://localhost:3001/api/realtime/task \
  -H "Content-Type: application/json" \
  -d '{"taskId": "T1", "executionTime": 2, "period": 5, "deadline": 5}'

# 2. Run RMS scheduling
curl -X POST http://localhost:3001/api/realtime/schedule/rms

# 3. Analyze schedulability
curl -X GET http://localhost:3001/api/realtime/analysis/schedulability

# 4. Compare algorithms
curl -X POST http://localhost:3001/api/realtime/compare \
  -H "Content-Type: application/json" \
  -d '{"algorithms": ["rms", "edf"]}'
```

---

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   cd backend
   npm install
   node index.js
   ```

2. **Test basic connectivity:**
   ```bash
   curl http://localhost:3001/health
   ```

3. **Get all available endpoints:**
   ```bash
   curl http://localhost:3001/
   ```

4. **Run a demo simulation:**
   ```bash
   curl -X POST http://localhost:3001/api/processes/demo/basic
   ```

---

## 📚 Educational Usage

### For Students
- Use individual algorithm endpoints to understand specific concepts
- Run demo simulations to see algorithms in action
- Compare different algorithms using comparison endpoints
- Experiment with different parameters to see performance impacts

### For Instructors
- Use in classroom demonstrations
- Assign hands-on exercises using specific endpoints
- Create custom scenarios for testing student understanding
- Generate performance data for analysis assignments

---

## 🛠️ Development

### Adding New Algorithms
1. Implement algorithm in appropriate `algorithms/*.js` file
2. Add API routes in corresponding `api/*Routes.js` file
3. Update main `index.js` to include new routes
4. Add documentation to this file

### Testing
All endpoints can be tested using curl, Postman, or any HTTP client. The server includes comprehensive error handling and input validation.

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Process IDs and resource IDs are strings
- Time values (burst time, arrival time) are integers
- Memory sizes are in bytes unless otherwise specified
- All APIs support CORS for frontend integration

For more information, see the project repository: https://github.com/guangliangyang/operationSystemDemo.git