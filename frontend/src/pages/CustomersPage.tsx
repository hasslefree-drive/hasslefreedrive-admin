import React, { useEffect, useState } from 'react';
import { fetchCustomers } from '../services/api';
import type { Customer } from '../types';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await fetchCustomers();
        setCustomers(data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
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
          <h1>Customer Management</h1>
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
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    Loading customers from Firebase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No customers found in Firebase
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
