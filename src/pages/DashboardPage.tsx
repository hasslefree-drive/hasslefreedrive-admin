import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { fetchStats, updateUserRole } from '../services/api';

interface MemberRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Customer' | 'Driver';
  date: string;
  rawDate: number;
}

type RoleFilter = 'all' | 'driver';

const fmt = (ts: any): string => {
  if (!ts) return 'Recent';
  if (ts?.toDate) return ts.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const rawTs = (ts: any): number => {
  if (!ts) return 0;
  if (ts?.toDate) return ts.toDate().getTime();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const CACHE_KEY_STATS = 'hfd_dashboard_stats';

const DashboardPage: React.FC = () => {
  const cachedStats = (() => {
    try {
      const s = localStorage.getItem(CACHE_KEY_STATS);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [totalRides, setTotalRides] = useState<number>(cachedStats?.totalBookings ?? 0);
  const [totalRevenue, setTotalRevenue] = useState<number>(cachedStats?.totalRevenue ?? 0);
  const [verifiedDrivers, setVerifiedDrivers] = useState<number>(cachedStats?.verifiedDrivers ?? 0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const firstUserSnap = useRef(false);
  const firstBookingSnap = useRef(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Real-time: users collection ───────────────────────────────────────────
  useEffect(() => {
    // No orderBy — avoids index errors on docs missing createdAt; sort client-side
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: MemberRow[] = snap.docs.map((doc) => {
          const d = doc.data();
          // Backend stores role as `type` field ('driver' | 'customer')
          const role: MemberRow['role'] = d.type === 'driver' ? 'Driver' : 'Customer';
          return {
            id: doc.id,
            name: d.name || d.displayName || 'Unnamed',
            email: d.email || '',
            phone: d.phone || d.phoneNumber || '',
            role,
            date: fmt(d.createdAt),
            rawDate: rawTs(d.createdAt),
          };
        });
        rows.sort((a, b) => b.rawDate - a.rawDate);
        setMembers(rows);

        const verDrv = snap.docs.filter(
          (doc) => doc.data().type === 'driver' && doc.data().verificationStatus === 'verified'
        ).length;
        setVerifiedDrivers(verDrv);

        if (!firstUserSnap.current) {
          firstUserSnap.current = true;
          if (firstBookingSnap.current) setLoading(false);
        }
      },
      (err) => {
        console.error('users snapshot error:', err);
        setError('Failed to load real-time data. Check Firestore rules.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Real-time: bookings collection ────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'bookings'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTotalRides(snap.size);
        if (!firstBookingSnap.current) {
          firstBookingSnap.current = true;
          if (firstUserSnap.current) setLoading(false);
        }
      },
      () => {
        // Non-fatal — bookings may be restricted; keep cached value
        if (!firstBookingSnap.current) {
          firstBookingSnap.current = true;
          if (firstUserSnap.current) setLoading(false);
        }
      }
    );
    return () => unsub();
  }, []);

  // ── Fetch revenue once (aggregated on backend) ────────────────────────────
  useEffect(() => {
    fetchStats()
      .then((s) => {
        setTotalRevenue(s.totalRevenue ?? 0);
        try { localStorage.setItem(CACHE_KEY_STATS, JSON.stringify(s)); } catch {}
      })
      .catch(() => {});
  }, []);

  // ── Role toggle ───────────────────────────────────────────────────────────
  const handleRoleToggle = async (member: MemberRow) => {
    const newRole = member.role === 'Customer' ? 'driver' : 'customer';
    const newRoleLabel: MemberRow['role'] = newRole === 'driver' ? 'Driver' : 'Customer';
    setTogglingId(member.id);
    try {
      await updateUserRole(member.id, newRole);
      // onSnapshot fires automatically — no manual state update needed
      showToast(`${member.name} is now a ${newRoleLabel}`, 'success');
    } catch (err) {
      showToast((err as Error).message || 'Failed to update role', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleHeaderClick = useCallback(() => {
    setRoleFilter((prev) => (prev === 'all' ? 'driver' : 'all'));
  }, []);

  const filtered = members.filter((m) => {
    if (roleFilter === 'driver' && m.role !== 'Driver') return false;
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.phone.includes(term)
    );
  });

  const driverCount = members.filter((m) => m.role === 'Driver').length;
  const customerCount = members.filter((m) => m.role === 'Customer').length;

  return (
    <section id="dashboard" className="view-section view-container active">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, here's what's happening today.</p>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Stats Cards — driven by live Firestore snapshots */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-id-card" /></div>
          <div className="stat-details">
            <h3>Total Drivers</h3>
            <div className="value">{loading ? '...' : driverCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fa-solid fa-user-check" /></div>
          <div className="stat-details">
            <h3>Verified Drivers</h3>
            <div className="value">{loading ? '...' : verifiedDrivers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fa-solid fa-car" /></div>
          <div className="stat-details">
            <h3>Total Rides</h3>
            <div className="value">{loading ? '...' : totalRides}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fa-solid fa-indian-rupee-sign" /></div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <div className="value">{`₹${totalRevenue.toLocaleString()}`}</div>
          </div>
        </div>
      </div>

      {/* Users & Drivers Table */}
      <div className="card users-table-card">
        <div
          className="card-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
        >
          <h3>
            <i className="fa-solid fa-users" style={{ marginRight: '0.5rem', color: 'var(--primary-color)' }} />
            All Users &amp; Drivers
            {(customerCount > 0 || driverCount > 0) && (
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                ({customerCount} customers · {driverCount} drivers)
              </span>
            )}
          </h3>

          {/* Search bar */}
          <div className="dashboard-search-bar">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              id="dashboardUserSearch"
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 0.25rem', lineHeight: 1 }}
                title="Clear search"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Name</th>
                <th style={{ width: '26%' }}>Email</th>
                <th style={{ width: '18%' }}>Phone</th>
                <th style={{ width: '13%' }}>
                  <button
                    id="roleFilterBtn"
                    className="role-filter-header-btn"
                    onClick={handleRoleHeaderClick}
                    title={roleFilter === 'all' ? 'Click to show Drivers only' : 'Click to show All'}
                  >
                    Role
                    <i
                      className="fa-solid fa-chevron-down"
                      style={{
                        marginLeft: '0.35rem',
                        fontSize: '0.68rem',
                        transform: roleFilter === 'driver' ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        color: roleFilter === 'driver' ? '#4f46e5' : 'inherit',
                      }}
                    />
                  </button>
                </th>
                <th style={{ width: '12%' }}>Joined</th>
                <th className="text-center" style={{ width: '9%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />
                    Connecting to real-time data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    {searchTerm
                      ? `No results for "${searchTerm}"`
                      : roleFilter === 'driver'
                      ? 'No drivers found'
                      : 'No users found'}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 600 }}>{member.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {member.email || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                      {member.phone || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td>
                      <span className={member.role === 'Driver' ? 'badge badge-driver' : 'badge badge-customer'}>
                        <i
                          className={`fa-solid ${member.role === 'Driver' ? 'fa-car' : 'fa-user'}`}
                          style={{ marginRight: '0.35rem', fontSize: '0.7rem' }}
                        />
                        {member.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{member.date}</td>
                    <td className="text-center">
                      <label
                        className="role-toggle-switch"
                        title={
                          togglingId === member.id
                            ? 'Updating...'
                            : member.role === 'Driver'
                            ? 'Switch to Customer'
                            : 'Switch to Driver'
                        }
                      >
                        <input
                          type="checkbox"
                          id={`toggle-${member.id}`}
                          checked={member.role === 'Driver'}
                          disabled={togglingId === member.id}
                          onChange={() => handleRoleToggle(member)}
                        />
                        <span className="role-toggle-track">
                          <span className="role-toggle-thumb">
                            {togglingId === member.id ? (
                              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '0.6rem' }} />
                            ) : (
                              <i
                                className={`fa-solid ${member.role === 'Driver' ? 'fa-car' : 'fa-user'}`}
                                style={{ fontSize: '0.6rem' }}
                              />
                            )}
                          </span>
                        </span>
                      </label>
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
