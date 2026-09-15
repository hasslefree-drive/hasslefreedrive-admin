import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchRevenueReport, fetchDrivers } from '../services/api';
import type { RevenuePoint, Driver } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportsPage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rev, drvs] = await Promise.all([
          fetchRevenueReport().catch(() => []),
          fetchDrivers().catch(() => []),
        ]);
        setRevenueData(rev || []);
        setDrivers(drvs || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.total, 0);

  const chartData = {
    labels: revenueData.length > 0 ? revenueData.map((d) => d.month) : ['No Data'],
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: revenueData.length > 0 ? revenueData.map((d) => d.total) : [0],
        backgroundColor: '#0F9D58',
        borderRadius: 4,
        maxBarThickness: 60,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ₹${context.raw?.toLocaleString() || 0}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value: any) => `₹${value}`,
          color: '#6B7280',
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280' },
      },
    },
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.phone && d.phone.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || d.verificationStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <section id="reports" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Generate and analyze business metrics dynamically.</p>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Monthly Revenue Report */}
      <div className="dashboard-grid single-column mb-lg" style={{ marginBottom: '2rem' }}>
        <div className="card chart-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Monthly Revenue Report</h3>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{totalRevenue.toLocaleString()}
              </span>
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                <i className="fa-solid fa-arrow-trend-up" style={{ marginRight: '0.25rem' }} />
                Real-time
              </div>
            </div>
          </div>
          <div className="card-body" style={{ height: '340px', padding: '1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', marginRight: '0.75rem' }} />
                Loading report data...
              </div>
            ) : revenueData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexDirection: 'column', gap: '0.5rem' }}>
                <i className="fa-solid fa-chart-column" style={{ fontSize: '2rem', color: '#cbd5e1' }} />
                <span>No revenue data found in Firebase</span>
              </div>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Driver Database Report */}
      <div className="card table-card">
        <div className="card-header border-bottom flex-header">
          <h3>Driver Database Report</h3>
          <div className="table-filters" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: '220px' }}
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
                <th>Driver ID</th>
                <th>Driver Name</th>
                <th>Phone</th>
                <th>License No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    Loading drivers...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No drivers found in Firebase
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.uid}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{driver.uid.slice(0, 8)}...</td>
                    <td style={{ fontWeight: 600 }}>{driver.name || 'Unnamed Driver'}</td>
                    <td>{driver.phone || 'N/A'}</td>
                    <td>{driver.drivingLicense || 'N/A'}</td>
                    <td>
                      <span className={`badge ${driver.verificationStatus === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                        {driver.verificationStatus ? driver.verificationStatus.replace('_', ' ') : 'Pending'}
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

export default ReportsPage;
