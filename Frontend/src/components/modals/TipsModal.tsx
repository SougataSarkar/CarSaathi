const TipsModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Used Car Selling Tips</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Used Car Selling Tips</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>How to get the highest price and fast closures for your car.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { icon: '🧼', title: 'Clean & Detail the Vehicle', desc: 'Wash the exterior and vacuum the interior. A clean car increases perceived value by up to 10%.' },
          { icon: '📸', title: 'Take Quality Photos in Day Light', desc: 'Shoot at least 6 high-res photos: Front-three-quarter, side profile, rear, dashboard, rear legroom, and tire condition.' },
          { icon: '📋', title: 'Prepare Service History', desc: 'Buyers pay a premium for cars with complete, verifiable maintenance files and insurance documents.' },
          { icon: '🏷️', title: 'Price it Competitively', desc: 'Check similar listings in your city or use our Valuation Tool to price your car within a sweet spot.' }
        ].map(tip => (
          <div key={tip.title} style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '1.8rem', lineHeight: '1' }}>{tip.icon}</span>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-dark)' }}>{tip.title}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>{tip.desc}</p>
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

export default TipsModal;
