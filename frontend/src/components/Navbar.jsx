import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/processes', label: 'Process Scheduling', icon: '⚙️' },
    { path: '/memory', label: 'Memory Management', icon: '💾' },
    { path: '/filesystem', label: 'File System', icon: '📁' },
    { path: '/io', label: 'I/O Management', icon: '🔌' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>OS Demo</h2>
        <span className="nav-subtitle">Operating System Principles</span>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;