const TrackerModal = ({ onClose, user, isPage }: { onClose?: () => void; user: any; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Track Listing Status</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Track Listing Status</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Tracking listing applications for user: <strong>{user?.name || 'Guest'}</strong></p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { step: '1', title: 'Listing Application Received', desc: 'Car details and documentation submitted successfully.', status: 'completed' },
          { step: '2', title: 'Home Technical Inspection', desc: 'Home physical evaluation scheduled and pending verification.', status: 'in-progress' },
          { step: '3', title: 'Inspection Report Generation', desc: 'Compiling 140-point checklist & grading verification certificate.', status: 'pending' },
          { step: '4', title: 'Published Live to Buyer Grid', desc: 'Elasticsearch integration live.', status: 'pending' }
        ].map((item, index) => (
          <div key={item.step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {index < 3 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '12px',
                width: '2px',
                height: 'calc(100% + 8px)',
                background: item.status === 'completed' ? '#ff5a00' : 'var(--border-light)'
              }} />
            )}

            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: item.status === 'completed' ? '#ff5a00' : item.status === 'in-progress' ? 'rgba(255, 90, 0, 0.15)' : 'var(--bg-body)',
              border: item.status === 'completed' ? 'none' : item.status === 'in-progress' ? '2px solid #ff5a00' : '2px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.status === 'completed' ? '#fff' : item.status === 'in-progress' ? '#ff5a00' : 'var(--text-gray)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 2
            }}>
              {item.status === 'completed' ? '✓' : item.step}
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: '700', color: item.status === 'pending' ? 'var(--text-gray)' : 'var(--text-dark)' }}>
                {item.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>
                {item.desc}
              </p>
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
          gap: '20px',
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

export default TrackerModal;
