# Operating System Principles Demo

## 📚 Project Overview

An interactive educational platform that demonstrates core operating system concepts through visual simulations, hands-on exercises, and practical examples. Designed specifically for Computer Information Systems (CIS) students to learn OS principles through real implementations.

## 🌟 Key Features

- **20+ OS Algorithms**: Complete implementations of scheduling, memory, and synchronization algorithms
- **Interactive Visualizations**: D3.js powered Gantt charts and real-time simulations
- **50+ API Endpoints**: Comprehensive RESTful coverage for all OS concepts
- **Educational Focus**: Step-by-step demonstrations and performance comparisons
- **Modern Stack**: React.js frontend with Node.js/Express backend

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0+
- npm 8.0+
- Git
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/guangliangyang/operationSystemDemo.git
cd operationSystemDemo

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install && cd ..

# Start the application
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🎯 Learning Modules

### 1. Process Scheduling
- **Algorithms**: FCFS, SJF, Round Robin, Priority Scheduling
- **Features**: Interactive Gantt charts, performance metrics comparison
- **API**: `/api/processes/*`

### 2. Memory Management
- **Allocation**: First Fit, Best Fit, Worst Fit
- **Virtual Memory**: FIFO, LRU, Optimal page replacement
- **API**: `/api/memory/*`

### 3. File Systems
- **Allocation Methods**: Contiguous, Linked, Indexed
- **Disk Scheduling**: FCFS, SSTF, SCAN, C-SCAN, LOOK
- **API**: `/api/filesystem/*`

### 4. I/O Management
- **Device Scheduling**: FCFS, SJF algorithms
- **Buffering**: Producer-consumer model simulation
- **API**: `/api/io/*`

### 5. Advanced Features
- **Synchronization**: Semaphores, Mutexes, Monitors
- **Deadlock**: Detection, Prevention, Banker's Algorithm
- **Real-Time**: RMS, EDF, DMS, LST scheduling
- **Advanced Memory**: Segmentation, Paging, Garbage Collection

## 🔧 Usage Examples

### Web Interface
Visit http://localhost:5173 and select any module to start learning interactively.

### API Usage
```bash
# Test server connectivity
curl http://localhost:3001/health

# Run process scheduling simulation
curl -X POST http://localhost:3001/api/processes/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "RoundRobin",
    "timeQuantum": 4,
    "processes": [
      {"id": "P1", "arrivalTime": 0, "burstTime": 10, "priority": 1},
      {"id": "P2", "arrivalTime": 1, "burstTime": 6, "priority": 2}
    ]
  }'

# Memory allocation example
curl -X POST http://localhost:3001/api/memory/allocate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "BestFit", "processId": "P1", "size": 256}'
```

## 📊 Project Structure

```
operationSystemDemo/
├── frontend/                 # React.js Application
│   ├── src/components/       # UI Components
│   ├── src/pages/           # Main Application Pages
│   └── public/              # Static Assets
├── backend/                 # Node.js/Express Backend
│   ├── algorithms/          # OS Algorithm Implementations
│   ├── api/                # RESTful API Routes
│   └── index.js            # Main Server
├── docs/                   # Comprehensive Documentation
│   ├── USAGE_GUIDE.md      # Detailed Usage Instructions
│   ├── API_DOCUMENTATION.md # Complete API Reference
│   └── PROJECT_COMPLETE.md  # Project Summary
└── package.json            # Project Configuration
```

## 📖 Documentation

- **[Complete Usage Guide](docs/USAGE_GUIDE.md)** - Detailed installation and usage instructions
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Comprehensive API reference with examples
- **[Project Plan](PROJECT_PLAN.md)** - Complete development roadmap and status
- **[Project Summary](docs/PROJECT_COMPLETE.md)** - Final implementation achievements

## 🎓 Educational Applications

### For Students
- Interactive algorithm exploration with real-time feedback
- Performance comparison tools for understanding trade-offs
- Hands-on parameter configuration and experimentation
- Progressive learning from basic to advanced concepts

### For Instructors
- Ready-to-use classroom demonstrations
- Configurable exercises for assignments
- Performance data for student evaluation
- Comprehensive coverage of OS curriculum

### For Self-Learners
- Structured learning path with 4 progressive phases
- Practical implementations with working code examples
- Safe experimentation environment
- Complete reference documentation

## 🔬 Technical Highlights

- **Mathematical Accuracy**: All algorithms implement correct formulas and logic
- **Performance Optimized**: Sub-second response times for all simulations
- **Modular Architecture**: Clean separation of concerns for easy extension
- **Error Handling**: Comprehensive validation and user feedback
- **Educational Design**: Focused on learning outcomes and practical understanding

## 🛠️ Development

### Adding New Algorithms
1. Implement in `backend/algorithms/`
2. Add API routes in `backend/api/`
3. Register routes in `backend/index.js`
4. Update documentation

### Running Tests
```bash
# Test all API endpoints
curl http://localhost:3001/

# Run specific algorithm demos
curl -X POST http://localhost:3001/api/processes/demo/basic
curl -X POST http://localhost:3001/api/memory/demo/comprehensive
```

## 📈 Project Status

**Status**: ✅ **COMPLETED**

- **Phase 1**: Foundation & Architecture ✅
- **Phase 2**: Core OS Features ✅
- **Phase 3**: Advanced Features ✅
- **Phase 4**: Documentation & Polish ✅

**Achievements**:
- 20+ OS algorithms implemented
- 50+ API endpoints created
- Complete documentation suite
- 100% feature completion
- Production-ready code quality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Submit a pull request

## 📞 Support

- **Repository**: https://github.com/guangliangyang/operationSystemDemo.git
- **Issues**: Create GitHub issues for bug reports
- **Documentation**: See `docs/` directory for detailed guides

## 📝 License

Educational project for CIS curriculum - see repository for details.

---

**🎯 Ready to explore operating system principles?**
**Start your learning journey at http://localhost:5173**