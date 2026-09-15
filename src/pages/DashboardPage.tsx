import React, { useEffect, useState } from 'react';
import { fetchStats, fetchCustomers, fetchDrivers } from '../services/api';
import type { Stats, Customer, Driver } from '../types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsData, usersData, driversData] = await Promise.all([
          fetchStats().catch(() => null),
          fetchCustomers().catch(() => []),
          fetchDrivers().catch(() => []),
        ]);
        setStats(statsData);
        setUsers(usersData || []);
        setDrivers(driversData || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  // Combine users and drivers for recent list
  const combinedMembers = [
    ...users.map((u) => ({
      id: u.uid,
      name: u.name || 'Unnamed Customer',
      email: u.email,
      role: 'Customer',
      active: true,
      date: u.createdAt || 'Recent',
    })),
    ...drivers.map((d) => ({
      id: d.uid,
      name: d.name || 'Unnamed Driver',
      email: d.email,
      role: 'Driver',
      active: d.isActive,
      date: d.createdAt || 'Recent',
    })),
  ].slice(0, 10);

  return (
    <section id="dashboard" className="view-section view-container active">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, here's what's happening today.</p>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fa-solid fa-id-card" />
          </div>
          <div className="stat-details">
            <h3>Total Drivers</h3>
            <div className="value">{loading ? '...' : (stats?.totalDrivers ?? drivers.length)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fa-solid fa-user-check" />
          </div>
          <div className="stat-details">
            <h3>Verified Drivers</h3>
            <div className="value">{loading ? '...' : (stats?.verifiedDrivers ?? drivers.filter((d) => d.verificationStatus === 'verified').length)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="fa-solid fa-car" />
          </div>
          <div className="stat-details">
            <h3>Total Rides</h3>
            <div className="value">{loading ? '...' : (stats?.totalBookings ?? 0)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fa-solid fa-indian-rupee-sign" />
          </div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <div className="value">{loading ? '...' : `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}</div>
          </div>
        </div>
      </div>

      {/* All Users & Drivers Table */}
      <div className="card users-table-card">
        <div className="card-header">
          <h3>
            <i className="fa-solid fa-users" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
            All Users & Drivers
          </h3>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Date</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    Loading data from Firebase...
                  </td>
                </tr>
              ) : combinedMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No users or drivers found in Firebase
                  </td>
                </tr>
              ) : (
                combinedMembers.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 600 }}>{member.name}</td>
                    <td>{member.email || 'N/A'}</td>
                    <td>
                      <span className={`badge ${member.role === 'Driver' ? 'badge-primary' : 'badge-warning'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>{member.date}</td>
                    <td className="text-center">
                      <span className={`badge ${member.active ? 'badge-success' : 'badge-danger'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
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

export default DashboardPage;
