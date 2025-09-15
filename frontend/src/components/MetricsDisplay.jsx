import './MetricsDisplay.css';

const MetricsDisplay = ({ metrics, processes }) => {
  return (
    <div className="metrics-display">
      <div className="metrics-overview">
        <div className="metric-card">
          <h4>Average Waiting Time</h4>
          <div className="metric-value">{metrics.averageWaitingTime.toFixed(2)}</div>
          <div className="metric-unit">time units</div>
        </div>

        <div className="metric-card">
          <h4>Average Turnaround Time</h4>
          <div className="metric-value">{metrics.averageTurnaroundTime.toFixed(2)}</div>
          <div className="metric-unit">time units</div>
        </div>

        <div className="metric-card">
          <h4>Total Execution Time</h4>
          <div className="metric-value">{metrics.totalTime}</div>
          <div className="metric-unit">time units</div>
        </div>

        <div className="metric-card">
          <h4>Throughput</h4>
          <div className="metric-value">{metrics.throughput.toFixed(3)}</div>
          <div className="metric-unit">processes/time unit</div>
        </div>
      </div>

      {processes && processes.length > 0 && (
        <div className="process-details">
          <h4>Process Details</h4>
          <div className="process-table-container">
            <table className="process-table">
              <thead>
                <tr>
                  <th>Process ID</th>
                  <th>Arrival Time</th>
                  <th>Burst Time</th>
                  <th>Start Time</th>
                  <th>Completion Time</th>
                  <th>Waiting Time</th>
                  <th>Turnaround Time</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process, index) => (
                  <tr key={index}>
                    <td className="process-id">{process.id}</td>
                    <td>{process.arrivalTime}</td>
                    <td>{process.burstTime}</td>
                    <td>{process.startTime !== -1 ? process.startTime : 'N/A'}</td>
                    <td>{process.completionTime}</td>
                    <td className="waiting-time">{process.waitingTime}</td>
                    <td className="turnaround-time">{process.turnaroundTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="metrics-explanation">
            <h5>Metrics Explanation:</h5>
            <ul>
              <li><strong>Waiting Time:</strong> Time a process waits in the ready queue before execution</li>
              <li><strong>Turnaround Time:</strong> Total time from arrival to completion (Waiting + Burst time)</li>
              <li><strong>Throughput:</strong> Number of processes completed per unit time</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsDisplay;