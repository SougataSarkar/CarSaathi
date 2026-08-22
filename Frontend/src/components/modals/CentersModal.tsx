const CentersModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const centers = [
    { name: 'CarSaathi Service Hub – Connaught Place', city: 'Delhi', address: 'B-27, CP Outer Ring Road, New Delhi 110001', timing: 'Mon-Sat: 9 AM – 7 PM | Sun: 10 AM – 2 PM', badge: 'Premium', services: ['Multi-brand', 'AC Specialist', 'Denting & Painting', 'Detailing Spa'] },
    { name: 'CarSaathi Authorised – BKC', city: 'Mumbai', address: 'Shop 14, Maker Chambers, BKC Complex, Mumbai 400051', timing: 'Mon-Sat: 9 AM – 8 PM | Sun: Closed', badge: 'Flagship', services: ['Multi-brand', 'EV Certified', 'Touchless Wash', 'Insurance Claim'] },
    { name: 'CarSaathi Express Hub – Indiranagar', city: 'Bangalore', address: '12th Main, HAL 2nd Stage, Indiranagar, Bangalore 560038', timing: 'Mon-Sun: 8 AM – 9 PM', badge: 'EV Ready', services: ['EV Certified', 'Battery Diagnostics', 'RSA Partner', 'Tyre Shop'] },
    { name: 'CarSaathi Multi-brand – Baner', city: 'Pune', address: 'Survey 72, Balewadi High Street, Baner-Pashan Road, Pune 411045', timing: 'Mon-Sat: 9 AM – 7 PM | Sun: 10 AM – 3 PM', badge: 'Trusted', services: ['Multi-brand', 'Annual Service Contracts', 'Detailing', 'Oil Change Express'] }
  ];

  const getBadgeColor = (badge: string) => {
    if (badge === 'Flagship') return '#3b82f6';
    if (badge === 'EV Ready') return '#10b981';
    if (badge === 'Trusted') return '#6366f1';
    return '#ff5a00';
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Service Centres Near You</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Service Centres Near You</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Find CarSaathi authorised service centres across India.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', maxHeight: '380px', overflowY: 'auto' }}>
        {centers.map(center => (
          <div key={center.name} style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-dark)', maxWidth: '75%' }}>{center.name}</h4>
              <span style={{ padding: '3px 8px', borderRadius: '12px', background: getBadgeColor(center.badge), color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{center.badge}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-gray)', marginBottom: '4px' }}>📍 {center.address}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)', marginBottom: '8px' }}>🕐 {center.timing}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {center.services.map((s, i) => (
                <span key={i} style={{ padding: '3px 8px', background: 'rgba(255, 90, 0, 0.06)', border: '1px solid rgba(255, 90, 0, 0.12)', borderRadius: '12px', fontSize: '0.7rem', color: 'var(--text-dark)' }}>{s}</span>
              ))}
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
          maxWidth: '460px',
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

export default CentersModal;
