import React, { useEffect, useState } from 'react';
import { fetchCustomers } from '../services/api';
import type { Customer } from '../types';

const CACHE_KEY_CUSTOMERS = 'hfd_cached_customers';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_CUSTOMERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_CUSTOMERS);
      return !saved || JSON.parse(saved).length === 0;
    } catch {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        if (customers.length === 0) {
          setLoading(true);
        } else {
          setIsSyncing(true);
        }

        const data = await fetchCustomers();
        if (!isMounted) return;

        const customerList = data || [];
        setCustomers(customerList);
        try {
          localStorage.setItem(CACHE_KEY_CUSTOMERS, JSON.stringify(customerList));
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

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  return (
    <section id="customers" className="view-section view-container active">
      <div className="page-header flex-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Customer Management
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
          <p>View registered customer accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '240px' }}
          />
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />
                    Loading customers from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    {searchTerm ? `No customers matching "${searchTerm}"` : 'No customers found in Firebase'}
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.uid}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{customer.uid.slice(0, 8)}...</td>
                    <td style={{ fontWeight: 600 }}>{customer.name || 'Unnamed Customer'}</td>
                    <td>{customer.phone || 'N/A'}</td>
                    <td>{customer.email || 'N/A'}</td>
                    <td>{customer.createdAt || 'Recent'}</td>
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

export default CustomersPage;
