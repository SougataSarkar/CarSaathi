const LaunchesModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const launches = [
    { name: 'Maruti Suzuki e-Vitara', price: '12.89 – 19.99 Lakh', date: 'June 2025', badge: 'NEW EV', color: '#10b981', desc: 'India\'s most awaited electric compact SUV with 500km WLTP range.' },
    { name: 'Hyundai Creta N Line', price: '16.82 – 20.40 Lakh', date: 'July 2025', badge: 'HOT', color: '#ef4444', desc: 'Sporty N-line pack with dual-tone body kit, 8-speaker Bose audio.' },
    { name: 'Mahindra XEV 9e', price: '26.90 – 35.20 Lakh', date: 'Aug 2025', badge: 'LUXURY EV', color: '#3b82f6', desc: '500km range, 0-100 in 5.7 sec, futuristic twin-screen cockpit.' },
    { name: 'Tata Harrier EV', price: '19.49 – 26.50 Lakh', date: 'Sep 2025', badge: 'UPCOMING', color: '#6366f1', desc: 'Full electric Harrier with Level-2 ADAS, 490km range.' }
  ];

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>New Car Launches 2025</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>New Car Launches 2025</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Official upcoming launches and price previews from top brands.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
        {launches.map(car => (
          <div key={car.name} style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ padding: '3px 10px', borderRadius: '20px', background: car.color, color: '#fff', fontSize: '0.68rem', fontWeight: 'bold' }}>{car.badge}</span>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{car.name}</h4>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>{car.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ff5a00' }}>₹{car.price}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)', fontWeight: '600' }}>📅 {car.date}</span>
            </div>
          </div>
        ))}
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
          maxWidth: '440px',
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

export default LaunchesModal;
