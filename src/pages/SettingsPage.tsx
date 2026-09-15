import React from 'react';
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <section id="settings" className="view-section view-container active">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Customize your admin experience and manage system preferences.</p>
      </div>

      <div className="dashboard-grid single-column">
        <div className="card">
          <div className="card-header">
            <h3>
              <i className="fa-solid fa-user-gear" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
              Profile Settings
            </h3>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={user?.displayName || 'Shailesh Gade'}
                  readOnly
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  defaultValue={user?.email || 'info@hasslefreedrive.com'}
                  readOnly
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;




