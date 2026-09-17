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
import { fetchRevenueReport } from '../services/api';
import type { RevenuePoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CACHE_KEY_REPORTS_REV = 'hfd_cached_reports_rev';

const ReportsPage: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_REPORTS_REV);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const savedRev = localStorage.getItem(CACHE_KEY_REPORTS_REV);
      const hasRev = savedRev && JSON.parse(savedRev).length > 0;
      return !hasRev;
    } catch {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        if (revenueData.length === 0) {
          setLoading(true);
        } else {
          setIsSyncing(true);
        }

        const rev = await fetchRevenueReport().catch(() => []);

        if (!isMounted) return;

        const revList = rev || [];
        setRevenueData(revList);

        try {
          localStorage.setItem(CACHE_KEY_REPORTS_REV, JSON.stringify(revList));
        } catch {}
      } catch (err) {
        if (isMounted) setError((err as Error).message);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
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

  return (
    <section id="reports" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Analytics &amp; Reports
            {isSyncing && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--primary-color)',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                title="Updating with latest data in background..."
              >
                <i className="fa-solid fa-arrows-rotate fa-spin" style={{ fontSize: '0.65rem' }} />
                Syncing...
              </span>
            )}
          </h1>
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
            {loading && revenueData.length === 0 ? (
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


    </section>
  );
};

export default ReportsPage;
