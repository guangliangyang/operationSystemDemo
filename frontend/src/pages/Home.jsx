import './Home.css';

const Home = () => {
  const features = [
    {
      title: "Process Scheduling",
      description: "Explore different CPU scheduling algorithms like FCFS, SJF, Round Robin, and Priority scheduling with interactive visualizations.",
      icon: "⚙️",
      path: "/processes"
    },
    {
      title: "Memory Management",
      description: "Learn about memory allocation strategies, virtual memory, paging, and segmentation through hands-on simulations.",
      icon: "💾",
      path: "/memory"
    },
    {
      title: "File Systems",
      description: "Understand file allocation methods, directory structures, and disk scheduling algorithms with visual demonstrations.",
      icon: "📁",
      path: "/filesystem"
    },
    {
      title: "I/O Management",
      description: "Simulate device drivers, interrupt handling, and buffering strategies in an interactive environment.",
      icon: "🔌",
      path: "/io"
    }
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Operating System Principles</h1>
          <p className="hero-subtitle">
            Interactive Educational Platform for Computer Information Systems Students
          </p>
          <p className="hero-description">
            Explore fundamental operating system concepts through visual simulations,
            hands-on exercises, and practical examples. Perfect for understanding
            complex OS principles in an engaging way.
          </p>
        </div>
      </section>

      <section className="features">
        <h2>Explore OS Concepts</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <button
                className="feature-btn"
                onClick={() => window.location.href = feature.path}
              >
                Explore →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="getting-started">
        <h2>Getting Started</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choose a Topic</h3>
            <p>Select from Process Scheduling, Memory Management, File Systems, or I/O Management</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Interactive Learning</h3>
            <p>Use visual simulations and hands-on exercises to understand concepts</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Practice & Test</h3>
            <p>Apply your knowledge through practical examples and built-in quizzes</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;