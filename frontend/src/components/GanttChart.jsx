import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './GanttChart.css';

const GanttChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.bottom - margin.top;

    const chartGroup = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get unique process IDs
    const processIds = [...new Set(data.map(d => d.processId))];
    const maxTime = Math.max(...data.map(d => d.endTime));

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(processIds)
      .range([0, height])
      .padding(0.1);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(processIds)
      .range(['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']);

    // Add X axis
    chartGroup.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Time');

    // Add Y axis
    chartGroup.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Processes');

    // Add bars
    chartGroup.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.startTime))
      .attr('y', d => yScale(d.processId))
      .attr('width', d => xScale(d.endTime) - xScale(d.startTime))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.processId === 'IDLE' ? '#e9ecef' : colorScale(d.processId))
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('opacity', d => d.processId === 'IDLE' ? 0.5 : 0.8);

    // Add text labels
    chartGroup.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.startTime) + (xScale(d.endTime) - xScale(d.startTime)) / 2)
      .attr('y', d => yScale(d.processId) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'middle')
      .style('fill', d => d.processId === 'IDLE' ? '#666' : 'white')
      .style('font-weight', 'bold')
      .style('font-size', '12px')
      .text(d => d.processId);

    // Add time markers
    chartGroup.selectAll('.time-marker')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'time-marker')
      .attr('x', d => xScale(d.startTime))
      .attr('y', height + 20)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => d.startTime);

    // Add end time marker for last process
    if (data.length > 0) {
      const lastProcess = data[data.length - 1];
      chartGroup.append('text')
        .attr('class', 'time-marker')
        .attr('x', xScale(lastProcess.endTime))
        .attr('y', height + 20)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#666')
        .text(lastProcess.endTime);
    }

    // Add title
    svg.append('text')
      .attr('x', (width + margin.left + margin.right) / 2)
      .attr('y', 25)
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Gantt Chart - Process Execution Timeline');

  }, [data]);

  return (
    <div className="gantt-chart">
      <svg ref={svgRef}></svg>
      {data && data.length > 0 && (
        <div className="gantt-legend">
          <h4>Legend:</h4>
          <div className="legend-items">
            {[...new Set(data.map(d => d.processId))].map(processId => (
              <div key={processId} className="legend-item">
                <div
                  className="legend-color"
                  style={{
                    backgroundColor: processId === 'IDLE' ? '#e9ecef' :
                      ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'][
                        [...new Set(data.map(d => d.processId))].indexOf(processId) % 6
                      ]
                  }}
                ></div>
                <span>{processId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;