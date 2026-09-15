import React, { useEffect, useState } from 'react';
import { fetchBookings } from '../services/api';
import type { Booking } from '../types';

const RidesPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await fetchBookings(filterStatus !== 'all' ? { status: filterStatus } : undefined);
        setBookings(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'accepted':
        return <span className="badge badge-primary">Accepted</span>;
      case 'searching':
      case 'scheduled':
        return <span className="badge badge-warning">{status}</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <section id="rides" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1>Ride History & Requests</h1>
          <p>Track all completed rides and active service requests.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Rides</option>
            <option value="completed">Completed</option>
            <option value="accepted">Accepted</option>
            <option value="scheduled">Scheduled</option>
            <option value="searching">Searching</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ride ID</th>
                <th>Customer</th>
                <th>Driver ID</th>
                <th>Car Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    Loading rides from Firebase...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No rides found in Firebase
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{booking.id.slice(0, 8)}...</td>
                    <td style={{ fontWeight: 600 }}>{booking.name || 'Unnamed Customer'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{booking.driverId ? `${booking.driverId.slice(0, 8)}...` : 'Unassigned'}</td>
                    <td>{booking.carType || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>₹{booking.baseCharge ?? booking.perKmRate ?? 0}</td>
                    <td>{getStatusBadge(booking.status)}</td>
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

export default RidesPage;
