import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: 'fa-solid fa-chart-line', label: 'Dashboard' },
  { to: '/drivers', icon: 'fa-solid fa-id-card', label: 'Drivers' },
  { to: '/rides', icon: 'fa-solid fa-car', label: 'Rides' },
  { to: '/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
  { to: '/reports', icon: 'fa-solid fa-file-invoice-dollar', label: 'Reports' },
];

const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/assests/Hasslelogo.png" alt="HassleFreeDrive Logo" />
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={logout}
          className="nav-link logout"
          style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

