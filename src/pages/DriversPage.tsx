import React, { useEffect, useState } from 'react';
import { fetchDrivers, updateDriverVerification, toggleDriverActive } from '../services/api';
import type { Driver } from '../types';

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await fetchDrivers(filterStatus);
      setDrivers(data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [filterStatus]);

  const handleToggleActive = async (uid: string) => {
    try {
      setActionLoading(uid);
      const res = await toggleDriverActive(uid);
      setDrivers((prev) =>
        prev.map((d) => (d.uid === uid ? { ...d, isActive: res.isActive } : d))
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (uid: string, status: string) => {
    try {
      setActionLoading(uid);
      await updateDriverVerification(uid, status);
      setDrivers((prev) =>
        prev.map((d) => (d.uid === uid ? { ...d, verificationStatus: status as any } : d))
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = drivers.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(term)) ||
      (d.phone && d.phone.includes(term)) ||
      (d.drivingLicense && d.drivingLicense.toLowerCase().includes(term))
    );
  });

  return (
    <section id="drivers" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1>Driver Management</h1>
          <p>Manage your fleet of drivers.</p>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card table-card">
        <div className="card-header border-bottom">
          <div className="table-filters" style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: '240px' }}
            />
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="registration_received">Registration Received</option>
              <option value="police_verification">Police Verification</option>
              <option value="background_check">Background Check</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>License No.</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    Loading drivers from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No drivers found in Firebase
                  </td>
                </tr>
              ) : (
                filtered.map((driver) => (
                  <tr key={driver.uid}>
                    <td style={{ fontWeight: 600 }}>{driver.name || 'Unnamed Driver'}</td>
                    <td>{driver.phone || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{driver.drivingLicense || 'N/A'}</td>
                    <td>
                      <span className={`badge ${driver.verificationStatus === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                        {driver.verificationStatus ? driver.verificationStatus.replace('_', ' ') : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(driver.uid)}
                        disabled={actionLoading === driver.uid}
                        className={`badge ${driver.isActive ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {driver.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            className="actions-btn"
                            title="Verify Driver"
                            onClick={() => handleVerify(driver.uid, 'verified')}
                            disabled={actionLoading === driver.uid}
                            style={{ color: '#0F9D58' }}
                          >
                            <i className="fa-solid fa-check" />
                          </button>
                        )}
                        {driver.verificationStatus !== 'rejected' && (
                          <button
                            type="button"
                            className="actions-btn delete"
                            title="Reject Driver"
                            onClick={() => handleVerify(driver.uid, 'rejected')}
                            disabled={actionLoading === driver.uid}
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default DriversPage;
