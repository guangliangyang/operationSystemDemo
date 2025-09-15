import { useState } from 'react';
import Button from './Button';
import './ProcessForm.css';

const ProcessForm = ({ onAddProcess }) => {
  const [formData, setFormData] = useState({
    id: '',
    arrivalTime: 0,
    burstTime: 1,
    priority: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'id' ? value : parseInt(value) || 0
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.id.trim()) {
      alert('Process ID is required');
      return;
    }

    if (formData.burstTime <= 0) {
      alert('Burst time must be greater than 0');
      return;
    }

    if (formData.arrivalTime < 0) {
      alert('Arrival time cannot be negative');
      return;
    }

    onAddProcess(formData);

    // Auto-increment process ID for next process
    const nextId = formData.id.match(/\d+$/)
      ? formData.id.replace(/\d+$/, (match) => parseInt(match) + 1)
      : formData.id + '2';

    setFormData({
      id: nextId,
      arrivalTime: 0,
      burstTime: 1,
      priority: 0
    });
  };

  const addSampleProcesses = () => {
    const sampleProcesses = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 4 },
      { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 },
      { id: 'P5', arrivalTime: 4, burstTime: 2, priority: 3 }
    ];

    sampleProcesses.forEach(process => {
      onAddProcess(process);
    });
  };

  return (
    <div className="process-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id">Process ID:</label>
          <input
            type="text"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleChange}
            placeholder="P1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="arrivalTime">Arrival Time:</label>
          <input
            type="number"
            id="arrivalTime"
            name="arrivalTime"
            value={formData.arrivalTime}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="burstTime">Burst Time:</label>
          <input
            type="number"
            id="burstTime"
            name="burstTime"
            value={formData.burstTime}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority:</label>
          <input
            type="number"
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            min="0"
            title="Lower number = Higher priority"
          />
          <small>Lower number = Higher priority</small>
        </div>

        <div className="form-actions">
          <Button type="submit" size="small">
            Add Process
          </Button>
          <Button type="button" variant="outline" size="small" onClick={addSampleProcesses}>
            Add Sample Data
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProcessForm;