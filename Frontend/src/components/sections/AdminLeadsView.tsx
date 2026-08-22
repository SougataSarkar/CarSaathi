import React from 'react';

interface AdminLeads {
  bookings: any[];
  services: any[];
  loans: any[];
  newCarLeads: any[];
}

interface AdminLeadsViewProps {
  adminLeads: AdminLeads | null;
  isAdminLeadsLoading: boolean;
  adminLeadsError: string | null;
  activeAdminTab: 'bookings' | 'services' | 'loans' | 'newCarLeads';
  setActiveAdminTab: (t: 'bookings' | 'services' | 'loans' | 'newCarLeads') => void;
}

const AdminLeadsView: React.FC<AdminLeadsViewProps> = ({
  adminLeads, isAdminLeadsLoading, adminLeadsError, activeAdminTab, setActiveAdminTab
}) => {
  return (
    <div className="admin-leads-container">
      <div className="tab-header" style={{ marginBottom: '30px' }}>
        <h1>📊 Leads &amp; Bookings Dashboard</h1>
        <p>Real-time overview of all customer inquiries, test drive requests, financing applications, and service bookings.</p>
      </div>

      {/* Dashboard Tabs */}
      <div className="tab-switcher" style={{ justifyContent: 'flex-start', borderBottom: '2px solid rgba(156, 163, 175, 0.1)', paddingBottom: '10px', marginBottom: '20px', gap: '15px' }}>
        {(['bookings', 'services', 'loans', 'newCarLeads'] as const).map(tab => {
          const labels: Record<string, string> = {
            bookings: `🚗 Test Drives (${adminLeads?.bookings?.length || 0})`,
            services: `🔧 Service Appointments (${adminLeads?.services?.length || 0})`,
            loans: `💰 Loan Applications (${adminLeads?.loans?.length || 0})`,
            newCarLeads: `🆕 New Cars Leads (${adminLeads?.newCarLeads?.length || 0})`
          };
          return (
            <button
              key={tab}
              className={`tab-btn ${activeAdminTab === tab ? 'active' : ''}`}
              onClick={() => setActiveAdminTab(tab)}
              style={{ borderRadius: '6px', padding: '8px 16px', border: 'none', background: activeAdminTab === tab ? 'var(--orange, #ff6f54)' : 'transparent', color: activeAdminTab === tab ? '#fff' : 'var(--text-dark, #1f2937)', cursor: 'pointer', fontWeight: '600' }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {isAdminLeadsLoading ? (
        <div className="details-loading-box">
          <div className="details-spinner"></div>
          <h3>Loading Dashboard...</h3>
        </div>
      ) : adminLeadsError ? (
        <div className="sell-success-box" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <h2>⚠️ Error</h2>
          <p>{adminLeadsError}</p>
        </div>
      ) : adminLeads ? (
        <div className="admin-leads-content" style={{ overflowX: 'auto', background: 'var(--card-bg, #fff)', border: '1px solid rgba(156, 163, 175, 0.15)', borderRadius: '12px', padding: '20px' }}>

          {/* Bookings Table */}
          {activeAdminTab === 'bookings' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                  <th style={{ padding: '12px' }}>Customer Name</th>
                  <th style={{ padding: '12px' }}>Phone Number</th>
                  <th style={{ padding: '12px' }}>Car Model</th>
                  <th style={{ padding: '12px' }}>Booking Date</th>
                  <th style={{ padding: '12px' }}>Time Slot</th>
                  <th style={{ padding: '12px' }}>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {adminLeads.bookings.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No test drive bookings found.</td></tr>
                ) : adminLeads.bookings.map((b: any) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{b.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{b.phone}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{b.make} {b.model}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{new Date(b.booking_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{b.booking_time}</td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(b.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Services Table */}
          {activeAdminTab === 'services' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                  <th style={{ padding: '12px' }}>Customer Name</th>
                  <th style={{ padding: '12px' }}>Phone Number</th>
                  <th style={{ padding: '12px' }}>Service Name</th>
                  <th style={{ padding: '12px' }}>City</th>
                  <th style={{ padding: '12px' }}>Appointment Date</th>
                  <th style={{ padding: '12px' }}>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {adminLeads.services.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No service bookings found.</td></tr>
                ) : adminLeads.services.map((s: any) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{s.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{s.phone}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{s.service_name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{s.city}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{new Date(s.booking_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(s.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Loans Table */}
          {activeAdminTab === 'loans' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                  <th style={{ padding: '12px' }}>Applicant</th>
                  <th style={{ padding: '12px' }}>Phone</th>
                  <th style={{ padding: '12px' }}>Income (Monthly)</th>
                  <th style={{ padding: '12px' }}>Employment</th>
                  <th style={{ padding: '12px' }}>Credit Score</th>
                  <th style={{ padding: '12px' }}>Loan Amount</th>
                  <th style={{ padding: '12px' }}>Tenure</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminLeads.loans.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No loan applications found.</td></tr>
                ) : adminLeads.loans.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{l.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.phone}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>₹{l.income.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.employment}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.credit_score}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--orange)' }}>₹{l.loan_amount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.tenure_years} years</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: l.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: l.status === 'Approved' ? '#10b981' : '#f59e0b' }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* New Car Inquiries */}
          {activeAdminTab === 'newCarLeads' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                  <th style={{ padding: '12px' }}>Customer Name</th>
                  <th style={{ padding: '12px' }}>Phone Number</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>City</th>
                  <th style={{ padding: '12px' }}>Car Model Interest</th>
                  <th style={{ padding: '12px' }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {adminLeads.newCarLeads.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No inquiries found.</td></tr>
                ) : adminLeads.newCarLeads.map((n: any) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{n.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.phone}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.email}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.city}</td>
                    <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.car_name}</td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(n.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          No dashboard data loaded.
        </div>
      )}
    </div>
  );
};

export default AdminLeadsView;
