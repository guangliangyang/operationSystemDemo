# Operating System Demo - 完整使用指南

## 📋 项目简介

Operating System Principles Demo 是一个交互式教育平台，通过可视化仿真、动手练习和实际示例来演示核心操作系统概念。本项目为计算机信息系统(CIS)学生提供完整的操作系统学习环境。

## 🚀 快速开始

### 系统要求
- **Node.js**: 版本 16.0 或更高
- **npm**: 版本 8.0 或更高
- **Git**: 用于克隆仓库
- **现代浏览器**: Chrome, Firefox, Safari, Edge

### 1. 获取项目代码
```bash
# 克隆项目仓库
git clone https://github.com/guangliangyang/operationSystemDemo.git

# 进入项目目录
cd operationSystemDemo
```

### 2. 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
cd ..
```

### 3. 启动服务

#### 方式一：同时启动前后端（推荐）
```bash
# 在项目根目录执行
npm run dev
```
这将同时启动：
- 后端API服务器：http://localhost:3001
- 前端开发服务器：http://localhost:5173

#### 方式二：分别启动
**启动后端服务器：**
```bash
cd backend
node index.js
# 或者使用 npm start（如果配置了）
```

**启动前端开发服务器（新终端窗口）：**
```bash
cd frontend
npm run dev
```

### 4. 验证安装
打开浏览器访问：
- **前端界面**：http://localhost:5173
- **后端API**：http://localhost:3001
- **健康检查**：http://localhost:3001/health

如果看到正常响应，说明安装成功！

## 🎯 使用方式

### A. 通过Web界面使用（学生推荐）

1. **访问主页**
   ```
   http://localhost:5173
   ```

2. **选择学习模块**
   - 进程调度 (Process Scheduling)
   - 内存管理 (Memory Management)
   - 文件系统 (File Systems)
   - I/O管理 (I/O Management)

3. **交互式学习**
   - 配置算法参数
   - 运行仿真
   - 查看性能指标
   - 比较不同算法

### B. 通过API直接使用（开发者/高级用户）

#### 基础API测试
```bash
# 检查服务器状态
curl http://localhost:3001/health

# 获取所有可用端点
curl http://localhost:3001/

# 查看API文档
curl http://localhost:3001/api/processes/algorithms
```

#### 进程调度示例
```bash
# 运行基础调度演示
curl -X POST http://localhost:3001/api/processes/demo/basic

# 自定义进程调度仿真
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
```

#### 内存管理示例
```bash
# 内存分配演示
curl -X POST http://localhost:3001/api/memory/demo/comprehensive

# 自定义内存分配
curl -X POST http://localhost:3001/api/memory/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "BestFit",
    "processId": "P1",
    "size": 256
  }'
```

#### 同步原语示例
```bash
# 创建信号量
curl -X POST http://localhost:3001/api/synchronization/semaphore/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "resource_sem",
    "initialValue": 3
  }'

# 信号量等待操作
curl -X POST http://localhost:3001/api/synchronization/semaphore/resource_sem/wait \
  -H "Content-Type: application/json" \
  -d '{"processId": "P1"}'
```

#### 死锁检测示例
```bash
# 运行经典死锁场景
curl -X POST http://localhost:3001/api/deadlock/simulate

# 检查系统安全性
curl -X GET http://localhost:3001/api/deadlock/safety-check
```

## 📚 学习路径

### 初学者路径
1. **开始学习**：访问Web界面 http://localhost:5173
2. **基础概念**：从进程调度开始
3. **逐步深入**：按顺序学习每个模块
4. **动手实践**：调整参数，观察结果变化

### 进阶用户路径
1. **API探索**：使用curl或Postman测试API
2. **自定义场景**：创建复杂的测试用例
3. **性能分析**：比较不同算法的效率
4. **扩展开发**：基于现有框架添加新功能

### 教师使用路径
1. **课堂演示**：使用预设演示进行教学
2. **作业设计**：利用API创建练习题
3. **学生评估**：使用比较功能评估学习效果
4. **课程集成**：与现有课程内容结合

## 🔧 详细功能说明

### 1. 进程调度 (Process Scheduling)
**支持的算法：**
- FCFS (First Come First Served)
- SJF (Shortest Job First)
- Round Robin
- Priority Scheduling

**使用方法：**
```bash
# 获取可用算法
curl http://localhost:3001/api/processes/algorithms

# 运行仿真
curl -X POST http://localhost:3001/api/processes/simulate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "FCFS", "processes": [...]}'

# 算法比较
curl -X POST http://localhost:3001/api/processes/compare \
  -H "Content-Type: application/json" \
  -d '{"algorithms": ["FCFS", "SJF", "RoundRobin"]}'
```

### 2. 内存管理 (Memory Management)
**支持的算法：**
- First Fit, Best Fit, Worst Fit
- FIFO, LRU, Optimal (页面置换)
- 内存压缩和碎片整理

**使用方法：**
```bash
# 内存分配
curl -X POST http://localhost:3001/api/memory/allocate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "BestFit", "processId": "P1", "size": 256}'

# 虚拟内存仿真
curl -X POST http://localhost:3001/api/memory/virtual/simulate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "LRU", "pageReferences": [1,2,3,4,1,2,5,1,2,3,4,5]}'
```

### 3. 高级同步 (Synchronization)
**支持的原语：**
- 信号量 (Semaphores)
- 互斥锁 (Mutexes)
- 监视器 (Monitors)

**使用方法：**
```bash
# 生产者-消费者问题仿真
curl -X POST http://localhost:3001/api/synchronization/demo/producer-consumer \
  -H "Content-Type: application/json" \
  -d '{
    "bufferSize": 5,
    "producers": 2,
    "consumers": 2,
    "timeLimit": 20
  }'
```

### 4. 死锁管理 (Deadlock)
**支持的算法：**
- 银行家算法 (Banker's Algorithm)
- 资源分配图 (Resource Allocation Graph)
- 死锁检测和预防

**使用方法：**
```bash
# 创建资源和进程
curl -X POST http://localhost:3001/api/deadlock/resource \
  -H "Content-Type: application/json" \
  -d '{"resourceId": "R1", "name": "Printer", "totalInstances": 1}'

# 死锁检测
curl -X GET http://localhost:3001/api/deadlock/deadlock-detection
```

### 5. 实时调度 (Real-time Scheduling)
**支持的算法：**
- RMS (Rate Monotonic Scheduling)
- EDF (Earliest Deadline First)
- DMS (Deadline Monotonic)
- LST (Least Slack Time)

**使用方法：**
```bash
# 添加实时任务
curl -X POST http://localhost:3001/api/realtime/task \
  -H "Content-Type: application/json" \
  -d '{"taskId": "T1", "executionTime": 2, "period": 5, "deadline": 5}'

# 可调度性分析
curl -X GET http://localhost:3001/api/realtime/analysis/schedulability
```

## 🛠️ 故障排除

### 常见问题

**1. 端口已被占用**
```bash
# 检查端口使用情况
lsof -i :3001  # 检查后端端口
lsof -i :5173  # 检查前端端口

# 杀死占用端口的进程
kill -9 <PID>
```

**2. 依赖安装失败**
```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules并重新安装
rm -rf node_modules package-lock.json
npm install
```

**3. 服务器启动失败**
```bash
# 检查Node.js版本
node --version  # 确保 >= 16.0

# 检查npm版本
npm --version   # 确保 >= 8.0

# 查看详细错误信息
DEBUG=* node backend/index.js
```

**4. API请求失败**
```bash
# 检查服务器状态
curl -v http://localhost:3001/health

# 检查网络连接
ping localhost

# 检查防火墙设置
```

### 性能优化

**后端优化：**
```bash
# 使用生产模式启动
NODE_ENV=production node backend/index.js

# 启用集群模式（可选）
npm install -g pm2
pm2 start backend/index.js --instances max
```

**前端优化：**
```bash
# 构建生产版本
cd frontend
npm run build

# 使用静态服务器
npm install -g serve
serve -s dist -l 5173
```

## 📖 API参考

### 完整端点列表
- **健康检查**: `GET /health`
- **进程调度**: `POST /api/processes/*`
- **内存管理**: `POST /api/memory/*`
- **文件系统**: `POST /api/filesystem/*`
- **I/O管理**: `POST /api/io/*`
- **同步原语**: `POST /api/synchronization/*`
- **死锁管理**: `POST /api/deadlock/*`
- **多级队列**: `POST /api/multilevel/*`
- **高级内存**: `POST /api/advanced-memory/*`
- **实时调度**: `POST /api/realtime/*`

### 详细API文档
请参阅：`docs/API_DOCUMENTATION.md` 获取完整的API参考和示例。

## 🎓 教育应用

### 课堂使用建议

**1. 算法演示**
```bash
# 准备演示数据
curl -X POST http://localhost:3001/api/processes/demo/basic > demo_result.json

# 在课堂上展示结果
cat demo_result.json | jq '.simulation.metrics'
```

**2. 学生练习**
为学生创建练习题，让他们：
- 配置不同的算法参数
- 比较算法性能
- 分析仿真结果

**3. 作业评估**
使用API创建标准化的测试用例，评估学生对算法的理解。

### 自学建议

**第1周：基础概念**
- 学习进程调度算法
- 理解甘特图
- 计算性能指标

**第2周：内存管理**
- 内存分配策略
- 虚拟内存概念
- 页面置换算法

**第3周：同步与死锁**
- 同步原语使用
- 死锁检测方法
- 预防策略

**第4周：高级特性**
- 实时调度
- 多级队列
- 系统性能分析

## 🔧 扩展开发

### 添加新算法
1. 在 `backend/algorithms/` 中实现算法
2. 在 `backend/api/` 中添加路由
3. 更新 `backend/index.js` 注册路由
4. 在前端添加相应组件

### 自定义配置
```javascript
// backend/config.js
module.exports = {
  port: process.env.PORT || 3001,
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};
```

## 📞 技术支持

### 获取帮助
- **项目仓库**: https://github.com/guangliangyang/operationSystemDemo.git
- **问题报告**: 在GitHub仓库中创建Issue
- **文档**: 查看 `docs/` 目录下的完整文档

### 贡献指南
欢迎提交Pull Request来改进项目：
1. Fork项目仓库
2. 创建特性分支
3. 提交改动
4. 创建Pull Request

---

**🎯 现在开始探索操作系统的世界吧！**

访问 http://localhost:5173 开始您的学习之旅！