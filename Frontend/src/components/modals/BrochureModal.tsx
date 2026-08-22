const BrochureModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const brochures = [
    { name: 'Hyundai Creta 2025', size: '6.2 MB', badge: 'Most Popular', color: '#3b82f6' },
    { name: 'Tata Nexon EV 2025', size: '4.8 MB', badge: 'EV Model', color: '#10b981' },
    { name: 'Kia Seltos X-Line 2025', size: '5.5 MB', badge: 'Sport', color: '#ef4444' },
    { name: 'Maruti e-Vitara 2025', size: '3.9 MB', badge: 'New Launch', color: '#ff5a00' },
    { name: 'Mahindra XUV700 2025', size: '7.1 MB', badge: 'Flagship', color: '#6366f1' }
  ];

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Download Car Brochures</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Download Car Brochures</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Official PDF brochures with specs, pricing, and colour options.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginTop: '8px' }}>
        {brochures.map(b => (
          <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', flexShrink: 0 }}>📋</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{b.name}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', background: b.color, color: '#fff', fontSize: '0.65rem', fontWeight: 'bold' }}>{b.badge}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>{b.size} PDF</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert(`Brochure for ${b.name} would begin downloading now.`)}
              style={{ padding: '8px 14px', background: '#ff5a00', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              ↓ Download
            </button>
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

export default BrochureModal;
