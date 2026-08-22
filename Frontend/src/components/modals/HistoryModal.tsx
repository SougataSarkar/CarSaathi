const HistoryModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const mockHistoryItems = [
    {
      id: 'INV-2024-089',
      date: '14 Feb 2024',
      service: 'Full Body Exterior Detailing',
      center: 'CarSaathi Service Hub, Connaught Place, Delhi',
      amount: '₹3,499',
      items: ['High-pressure Jet Wash', 'Clay Bar Treatment', 'Ceramic Wax Coating (60 days)', 'Glass Polish & Raincoat'],
      nextDue: '14 May 2024'
    },
    {
      id: 'INV-2024-034',
      date: '10 Nov 2023',
      service: 'Periodic Maintenance + Full Safety Inspection',
      center: 'CarSaathi Authorised Service, Gurgaon',
      amount: '₹6,890',
      items: ['Engine Oil Change (5W-30 FULL SYNTHETIC)', 'Brake Pad Inspection', 'Tyre Pressure & Rotation', 'Suspension & Steering Checkup'],
      nextDue: '10 May 2024'
    }
  ];

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Service History & Records</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Service History & Records</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Your previous vehicle maintenance records and service reports.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto', textAlign: 'left' }}>
        {mockHistoryItems.map(item => (
          <div key={item.id} style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{item.service}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-gray)', marginTop: '2px' }}>{item.center}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ff5a00' }}>{item.amount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)', marginTop: '2px' }}>{item.date}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-gray)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {item.items.map((s, i) => (
                  <span key={i} style={{ padding: '3px 8px', background: 'rgba(255, 90, 0, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 90, 0, 0.12)', color: 'var(--text-dark)' }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#10b981', fontWeight: '600' }}>Next Service Due: {item.nextDue}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', textAlign: 'left' }}>
        🔒 Service data synced from CarSaathi verified partner network. Digital GST invoices available on WhatsApp.
      </div>
    </>
  );

  if (isPage) {
    return (
      <div className="sub-option-page-card">
        {innerContent}
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '32px 24px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};

export default HistoryModal;
