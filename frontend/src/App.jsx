import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProcessScheduler from './pages/ProcessScheduler';
import MemoryManager from './pages/MemoryManager';
import FileSystem from './pages/FileSystem';
import IOManager from './pages/IOManager';
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/processes" element={<ProcessScheduler />} />
            <Route path="/memory" element={<MemoryManager />} />
            <Route path="/filesystem" element={<FileSystem />} />
            <Route path="/io" element={<IOManager />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App
