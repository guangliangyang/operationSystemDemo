import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import GanttChart from '../components/GanttChart';
import ProcessForm from '../components/ProcessForm';
import MetricsDisplay from '../components/MetricsDisplay';
import './ProcessScheduler.css';

const ProcessScheduler = () => {
  const [processes, setProcesses] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fcfs');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [algorithms] = useState([
    { id: 'fcfs', name: 'First Come First Serve', description: 'Processes executed in arrival order' },
    { id: 'sjf', name: 'Shortest Job First', description: 'Shortest burst time first' },
    { id: 'rr', name: 'Round Robin', description: 'Fixed time slice rotation' },
    { id: 'priority', name: 'Priority Scheduling', description: 'Highest priority first' }
  ]);

  const addProcess = (process) => {
    setProcesses([...processes, process]);
  };

  const removeProcess = (index) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const clearProcesses = () => {
    setProcesses([]);
    setResults(null);
  };

  const runScheduling = async () => {
    if (processes.length === 0) {
      alert('Please add at least one process');
      return;
    }

    setLoading(true);
    try {
      // Send processes to backend
      await fetch('http://localhost:3001/api/processes/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes })
      });

      // Run selected algorithm
      let endpoint = `/api/processes/schedule/${selectedAlgorithm}`;
      let body = {};

      if (selectedAlgorithm === 'rr') {
        endpoint = '/api/processes/schedule/roundrobin';
        body = { timeQuantum };
      }

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Error running scheduling:', error);
      alert('Error running scheduling algorithm');
    } finally {
      setLoading(false);
    }
  };

  const compareAlgorithms = async () => {
    if (processes.length === 0) {
      alert('Please add at least one process');
      return;
    }

    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/processes/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes })
      });

      const response = await fetch('http://localhost:3001/api/processes/schedule/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeQuantum })
      });

      const result = await response.json();
      setResults({ comparison: result.comparison });
    } catch (error) {
      console.error('Error comparing algorithms:', error);
      alert('Error comparing algorithms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Process Scheduling</h1>
        <p>Explore different CPU scheduling algorithms and their performance characteristics</p>
      </div>

      <div className="scheduler-container">
        <div className="scheduler-controls">
          <Card title="Add Processes">
            <ProcessForm onAddProcess={addProcess} />
          </Card>

          <Card title="Algorithm Selection">
            <div className="algorithm-selector">
              {algorithms.map(algo => (
                <div key={algo.id} className="algorithm-option">
                  <label>
                    <input
                      type="radio"
                      name="algorithm"
                      value={algo.id}
                      checked={selectedAlgorithm === algo.id}
                      onChange={(e) => setSelectedAlgorithm(e.target.value)}
                    />
                    <div className="algorithm-info">
                      <strong>{algo.name}</strong>
                      <span>{algo.description}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {selectedAlgorithm === 'rr' && (
              <div className="time-quantum">
                <label>
                  Time Quantum:
                  <input
                    type="number"
                    min="1"
                    value={timeQuantum}
                    onChange={(e) => setTimeQuantum(parseInt(e.target.value))}
                  />
                </label>
              </div>
            )}
          </Card>

          <Card title="Actions">
            <div className="action-buttons">
              <Button onClick={runScheduling} disabled={loading}>
                {loading ? 'Running...' : 'Run Algorithm'}
              </Button>
              <Button variant="secondary" onClick={compareAlgorithms} disabled={loading}>
                Compare All
              </Button>
              <Button variant="outline" onClick={clearProcesses}>
                Clear All
              </Button>
            </div>
          </Card>
        </div>

        <div className="scheduler-results">
          <Card title="Process List">
            <div className="process-list">
              {processes.length === 0 ? (
                <p>No processes added yet</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Arrival</th>
                      <th>Burst</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((process, index) => (
                      <tr key={index}>
                        <td>{process.id}</td>
                        <td>{process.arrivalTime}</td>
                        <td>{process.burstTime}</td>
                        <td>{process.priority || 0}</td>
                        <td>
                          <Button size="small" variant="danger" onClick={() => removeProcess(index)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {results && (
            <>
              {results.ganttChart && (
                <Card title={`Gantt Chart - ${results.algorithm}`}>
                  <GanttChart data={results.ganttChart} />
                </Card>
              )}

              {results.metrics && (
                <Card title="Performance Metrics">
                  <MetricsDisplay metrics={results.metrics} processes={results.processes} />
                </Card>
              )}

              {results.comparison && (
                <Card title="Algorithm Comparison">
                  <div className="comparison-grid">
                    {Object.entries(results.comparison).map(([key, data]) => (
                      <div key={key} className="comparison-item">
                        <h4>{data.algorithm}</h4>
                        <div className="metrics-summary">
                          <div>Avg Waiting: {data.metrics.averageWaitingTime.toFixed(2)}</div>
                          <div>Avg Turnaround: {data.metrics.averageTurnaroundTime.toFixed(2)}</div>
                          <div>Total Time: {data.metrics.totalTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessScheduler;