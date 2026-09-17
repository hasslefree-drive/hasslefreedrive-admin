import React, { useEffect, useState } from 'react';
import { fetchBookings, fetchDrivers } from '../services/api';
import type { Booking, Driver } from '../types';

const CACHE_KEY_BOOKINGS = 'hfd_cached_bookings';
const CACHE_KEY_DRIVERS = 'hfd_cached_drivers';

const formatBookingTime = (b: Booking): string => {
  const timeStr = b.bookingDateTime || b.startDateTime || b.createdAt;
  if (!timeStr) return '—';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeStr;
  }
};

const getPickupLocation = (b: Booking): string => {
  return b.pickupLocation || b.pickup?.description || '—';
};

const getDropLocation = (b: Booking): string => {
  return b.visitingLocation || b.dropoff?.description || '—';
};

const getStatusBadge = (status: string) => {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'completed':
      return (
        <span className="badge-status badge-status-completed">
          <i className="fa-solid fa-circle-check" />
          Completed
        </span>
      );
    case 'accepted':
      return (
        <span className="badge-status badge-status-accepted">
          <i className="fa-solid fa-check" />
          Accepted
        </span>
      );
    case 'scheduled':
      return (
        <span className="badge-status badge-status-scheduled">
          <i className="fa-solid fa-calendar-check" />
          Scheduled
        </span>
      );
    case 'searching':
      return (
        <span className="badge-status badge-status-searching">
          <i className="fa-solid fa-magnifying-glass" />
          Searching
        </span>
      );
    case 'pending':
      return (
        <span className="badge-status badge-status-pending">
          <i className="fa-solid fa-clock" />
          Pending
        </span>
      );
    case 'cancelled':
      return (
        <span className="badge-status badge-status-cancelled">
          <i className="fa-solid fa-ban" />
          Cancelled
        </span>
      );
    case 'rejected':
      return (
        <span className="badge-status badge-status-rejected">
          <i className="fa-solid fa-circle-xmark" />
          Rejected
        </span>
      );
    default:
      return <span className="badge-status">{status}</span>;
  }
};

const RidesPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_DRIVERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_BOOKINGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_BOOKINGS);
      return !saved || JSON.parse(saved).length === 0;
    } catch {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        if (bookings.length === 0) {
          setLoading(true);
        } else {
          setIsSyncing(true);
        }

        // Fetch bookings and drivers simultaneously so driver details are always resolved
        const [bookingsData, driversData] = await Promise.all([
          fetchBookings(filterStatus !== 'all' ? { status: filterStatus } : undefined),
          fetchDrivers().catch(() => [] as Driver[]),
        ]);

        if (!isMounted) return;

        if (driversData && driversData.length > 0) {
          setDrivers(driversData);
          try {
            localStorage.setItem(CACHE_KEY_DRIVERS, JSON.stringify(driversData));
          } catch {}
        }

        const driverMap = new Map<string, Driver>();
        (driversData && driversData.length > 0 ? driversData : drivers).forEach((d) => {
          driverMap.set(d.uid, d);
        });

        // Enrich bookings with driver name and phone if missing
        const rawList = bookingsData || [];
        const enrichedList = rawList.map((b) => {
          const matchedDriver = b.driverId ? driverMap.get(b.driverId) : undefined;
          return {
            ...b,
            driverName: b.driverName || matchedDriver?.name || '',
            driverPhone: b.driverPhone || matchedDriver?.phone || '',
          };
        });

        setBookings(enrichedList);

        if (filterStatus === 'all') {
          try {
            localStorage.setItem(CACHE_KEY_BOOKINGS, JSON.stringify(enrichedList));
          } catch {}
        }
      } catch (err) {
        if (isMounted) setError((err as Error).message);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [filterStatus]);

  // Create a quick driver lookup for client-side resolution
  const driverLookup = new Map<string, Driver>();
  drivers.forEach((d) => driverLookup.set(d.uid, d));

  const filtered = bookings.filter((b) => {
    const resolvedDriverName = b.driverName || (b.driverId ? driverLookup.get(b.driverId)?.name : '') || '';
    const resolvedDriverPhone = b.driverPhone || (b.driverId ? driverLookup.get(b.driverId)?.phone : '') || '';

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(term)) ||
      (b.phone && b.phone.includes(term)) ||
      resolvedDriverName.toLowerCase().includes(term) ||
      resolvedDriverPhone.includes(term) ||
      getPickupLocation(b).toLowerCase().includes(term) ||
      getDropLocation(b).toLowerCase().includes(term)
    );
  });

  return (
    <section id="rides" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Ride History &amp; Requests
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
          <p>Track all completed rides, active requests, and assigned drivers.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search passenger, driver, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '290px' }}
          />
          <select
            className="input-field"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ minWidth: '130px' }}
          >
            <option value="all">All Rides</option>
            <option value="scheduled">Scheduled</option>
            <option value="searching">Searching</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Passenger Phone</th>
                <th>Driver</th>
                <th>Driver Phone</th>
                <th>Pickup Location</th>
                <th>Drop Location</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />
                    Loading rides from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    {searchTerm
                      ? `No rides matching "${searchTerm}"`
                      : filterStatus !== 'all'
                      ? `No ${filterStatus} rides found`
                      : 'No rides found in Firebase'}
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => {
                  const resolvedDriverName =
                    booking.driverName || (booking.driverId ? driverLookup.get(booking.driverId)?.name : '');
                  const resolvedDriverPhone =
                    booking.driverPhone || (booking.driverId ? driverLookup.get(booking.driverId)?.phone : '');

                  return (
                    <tr key={booking.id}>
                      <td style={{ fontWeight: 600 }}>{booking.name || 'Unnamed Passenger'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                        {booking.phone || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td>
                        {resolvedDriverName ? (
                          <span style={{ fontWeight: 600 }}>{resolvedDriverName}</span>
                        ) : booking.driverId ? (
                          <span style={{ color: 'var(--text-secondary)' }}>Assigned</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                        {resolvedDriverPhone || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                        <span
                          title={getPickupLocation(booking)}
                          style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          <i className="fa-solid fa-location-dot" style={{ color: '#0F9D58', marginRight: '0.35rem', fontSize: '0.75rem' }} />
                          {getPickupLocation(booking)}
                        </span>
                      </td>
                      <td style={{ maxWidth: '220px', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                        <span
                          title={getDropLocation(booking)}
                          style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          <i className="fa-solid fa-location-arrow" style={{ color: '#EA4335', marginRight: '0.35rem', fontSize: '0.75rem' }} />
                          {getDropLocation(booking)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatBookingTime(booking)}
                      </td>
                      <td>{getStatusBadge(booking.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RidesPage;
