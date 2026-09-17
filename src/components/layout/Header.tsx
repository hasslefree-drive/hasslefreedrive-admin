import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  const displayName = user?.displayName || 'Shailesh Gade';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F9D58&color=fff`;

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="menu-toggle" id="menuToggle" aria-label="Toggle menu">
          <i className="fa-solid fa-bars" />
        </button>
      </div>

      <div className="header-right">
        <div className="user-profile" id="userProfileBtn">
          <img src={avatarUrl} alt="Admin" className="avatar" />
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;