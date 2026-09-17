import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchDrivers, toggleDriverActive } from '../services/api';
import type { Driver } from '../types';

const CACHE_KEY_DRIVERS = 'hfd_cached_drivers';

interface DocCardProps {
  title: string;
  url?: string;
  docNumberLabel?: string;
  docNumber?: string;
  dates?: { label: string; value: string | null }[];
  onZoom: (url: string, title: string) => void;
}

const DocumentCard: React.FC<DocCardProps> = ({
  title,
  url,
  docNumberLabel,
  docNumber,
  dates,
  onZoom,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{title}</span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 600, textDecoration: 'none' }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: '0.25rem' }} />
            Open
          </a>
        )}
      </div>

      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {url ? (
          <div
            style={{
              height: '160px',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => onZoom(url, title)}
            title="Click to zoom image"
          >
            {!imgError ? (
              <img
                src={url}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  padding: '1rem',
                }}
              >
                <i className="fa-solid fa-file-image" style={{ fontSize: '2rem', color: '#94a3b8' }} />
                <span>Document Image File</span>
                <span style={{ fontSize: '0.7rem', color: '#4338ca', fontWeight: 600 }}>Click to Preview Fullscreen</span>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                color: '#fff',
                fontSize: '1.2rem',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              <i className="fa-solid fa-magnifying-glass-plus" />
            </div>
          </div>
        ) : (
          <div
            style={{
              height: '160px',
              background: '#f1f5f9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '0.85rem',
            }}
          >
            No document uploaded
          </div>
        )}

        <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {docNumber && (
            <div>
              <span style={{ color: '#64748b' }}>{docNumberLabel || 'Number'}: </span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{docNumber}</span>
            </div>
          )}
          {dates?.map(
            (d, idx) =>
              d.value && (
                <div key={idx}>
                  <span style={{ color: '#64748b' }}>{d.label}: </span>
                  <span>{new Date(d.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_DRIVERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_DRIVERS);
      return !saved || JSON.parse(saved).length === 0;
    } catch {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);

  const loadDrivers = async () => {
    try {
      if (drivers.length === 0) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }

      const data = await fetchDrivers(filterStatus);
      const driverList = data || [];
      setDrivers(driverList);

      if (filterStatus === 'all') {
        try {
          localStorage.setItem(CACHE_KEY_DRIVERS, JSON.stringify(driverList));
        } catch {}
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [filterStatus]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enlargedImage) {
          setEnlargedImage(null);
        } else if (selectedDriver) {
          setSelectedDriver(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enlargedImage, selectedDriver]);

  const handleToggleActive = async (uid: string) => {
    try {
      setActionLoading(uid);
      const res = await toggleDriverActive(uid);
      setDrivers((prev) => {
        const updated = prev.map((d) => (d.uid === uid ? { ...d, isActive: res.isActive } : d));
        try {
          localStorage.setItem(CACHE_KEY_DRIVERS, JSON.stringify(updated));
        } catch {}
        return updated;
      });
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

  const formatAddress = (d: Driver) => {
    const parts = [d.houseNo, d.street, d.city, d.state, d.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  return (
    <section id="drivers" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Driver Management
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
          <p>Manage your fleet of drivers and inspect verification documents.</p>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card table-card">
        <div className="card-header border-bottom">
          <div className="table-filters" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search drivers by name, phone, license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minWidth: '320px', flex: '1 1 320px', maxWidth: '480px' }}
            />
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="registration_received">Registration Received</option>
              <option value="police_verification">Police Verification</option>
              <option value="background_check">Background Check</option>
              <option value="pending">Pending</option>
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
                <th className="text-center">Documents</th>
              </tr>
            </thead>
            <tbody>
              {loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />
                    Loading drivers from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    {searchTerm ? `No drivers matching "${searchTerm}"` : 'No drivers found in Firebase'}
                  </td>
                </tr>
              ) : (
                filtered.map((driver) => (
                  <tr key={driver.uid}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {driver.profilePhotoUrl ? (
                          <img
                            src={driver.profilePhotoUrl}
                            alt={driver.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                              // If image fails, replace with initial letter
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                          </div>
                        )}
                        <span>{driver.name || 'Unnamed Driver'}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>{driver.phone || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{driver.drivingLicense || 'N/A'}</td>
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
                        title="Click to toggle active status"
                      >
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedDriver(driver)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 1.1rem',
                          borderRadius: '8px',
                          border: '1px solid #c7d2fe',
                          background: '#eef2ff',
                          color: '#4338ca',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          minWidth: '130px',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#4338ca';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#eef2ff';
                          e.currentTarget.style.color = '#4338ca';
                        }}
                      >
                        <i className="fa-solid fa-file-lines" />
                        View Documents
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Documents Modal (Mounted directly on document.body via Portal) */}
      {selectedDriver &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              boxSizing: 'border-box',
            }}
            onClick={() => setSelectedDriver(null)}
          >
            <div
              className="hide-scrollbar"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '920px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'sticky',
                  top: 0,
                  background: '#ffffff',
                  zIndex: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {selectedDriver.profilePhotoUrl ? (
                    <img
                      src={selectedDriver.profilePhotoUrl}
                      alt={selectedDriver.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                      }}
                    >
                      {selectedDriver.name ? selectedDriver.name.charAt(0).toUpperCase() : 'D'}
                    </div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {selectedDriver.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>
                        <i className="fa-solid fa-phone" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }} />
                        {selectedDriver.phone || 'N/A'}
                      </span>
                      {selectedDriver.email && (
                        <span>
                          <i className="fa-solid fa-envelope" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }} />
                          {selectedDriver.email}
                        </span>
                      )}
                      <span className={`badge ${selectedDriver.verificationStatus === 'verified' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem' }}>
                        {selectedDriver.verificationStatus ? selectedDriver.verificationStatus.replace('_', ' ') : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDriver(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                  }}
                  title="Close modal"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Submitted Documents Grid */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-id-card" style={{ color: 'var(--primary-color)' }} />
                    Submitted Identification &amp; License Documents
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {/* 1. Driving License */}
                    <DocumentCard
                      title="Driving License (DL)"
                      url={selectedDriver.documents?.dlUrl}
                      docNumberLabel="License No"
                      docNumber={selectedDriver.drivingLicense}
                      dates={[
                        { label: 'Issued', value: selectedDriver.licenseIssueDate },
                        { label: 'Expires', value: selectedDriver.licenseExpiryDate },
                      ]}
                      onZoom={(url, title) => setEnlargedImage({ url, title })}
                    />

                    {/* 2. Aadhaar Card */}
                    <DocumentCard
                      title="Aadhaar Card"
                      url={selectedDriver.documents?.aadhaarUrl}
                      docNumberLabel="Aadhaar No"
                      docNumber={selectedDriver.aadhaarNumber}
                      onZoom={(url, title) => setEnlargedImage({ url, title })}
                    />

                    {/* 3. PAN Card */}
                    <DocumentCard
                      title="PAN Card"
                      url={selectedDriver.documents?.panUrl}
                      docNumberLabel="PAN No"
                      docNumber={selectedDriver.panNumber}
                      onZoom={(url, title) => setEnlargedImage({ url, title })}
                    />
                  </div>
                </div>

                {/* Personal & Address Details */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fa-solid fa-user-check" style={{ color: 'var(--primary-color)' }} />
                    Personal, Work &amp; Address Details
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Father's Name</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedDriver.fatherName || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Experience</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedDriver.experience || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Service Type</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedDriver.serviceType || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Date of Birth</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {selectedDriver.dob ? new Date(selectedDriver.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        {selectedDriver.age ? ` (${selectedDriver.age} yrs)` : ''}
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Residential Address</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{formatAddress(selectedDriver)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Emergency Contact</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {selectedDriver.emergencyName || '—'}
                        {selectedDriver.emergencyPhone ? ` (${selectedDriver.emergencyPhone})` : ''}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.78rem' }}>Reference Contact</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {selectedDriver.referenceName || '—'}
                        {selectedDriver.referencePhone ? ` (${selectedDriver.referencePhone})` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  background: '#f8fafc',
                  borderBottomLeftRadius: '16px',
                  borderBottomRightRadius: '16px',
                }}
              >
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1.25rem', fontWeight: 600 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Enlarged Document Lightbox (Mounted on document.body via Portal) */}
      {enlargedImage &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              boxSizing: 'border-box',
            }}
            onClick={() => setEnlargedImage(null)}
          >
            <div
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <a
                href={enlargedImage.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: '0.4rem' }} />
                Open Original
              </a>
              <button
                onClick={() => setEnlargedImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div
              style={{
                color: '#ffffff',
                marginBottom: '1rem',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {enlargedImage.title}
            </div>

            <img
              src={enlargedImage.url}
              alt={enlargedImage.title}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '8px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                objectFit: 'contain',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}
    </section>
  );
};

export default DriversPage;
