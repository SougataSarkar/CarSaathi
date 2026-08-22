import { useState, useEffect } from 'react';

const RsaModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dispatchStep, setDispatchStep] = useState(0);
  const [eta, setEta] = useState(15);

  useEffect(() => {
    if (!selectedService) return;
    setDispatchStep(1);
    setEta(15);

    const stepInterval = setInterval(() => {
      setDispatchStep(prev => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          return 4;
        }
        return prev + 1;
      });
      setEta(prev => Math.max(8, prev - Math.floor(Math.random() * 2) - 1));
    }, 2500);

    return () => clearInterval(stepInterval);
  }, [selectedService]);

  const triggerRsa = (service: string) => {
    setSelectedService(service);
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>24x7 Roadside Assistance</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>24x7 Roadside Assistance</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Stranded on the road? Tap below for instant emergency vehicle dispatch.</p>
      </div>

      {selectedService ? (
        <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.88rem', fontWeight: 'bold' }}>
            🚨 Emergency {selectedService} Unit Requested
          </div>

          {/* Live Progress Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '16px 0', textAlign: 'left', paddingLeft: '10px' }}>
            {[
              { step: 1, title: 'Request Transmitted', desc: 'GPS coordinates shared with regional dispatch center.' },
              { step: 2, title: 'Rescue Crew Assigned', desc: 'Partner towing & technical operator confirmed request.' },
              { step: 3, title: 'Rescue Vehicle Dispatched', desc: 'Crew en-route with required diagnostic machinery.' },
              { step: 4, title: 'Arriving at Destination', desc: `Emergency contact professional will reach you in ~${eta} mins.` }
            ].map(item => {
              const isActive = dispatchStep >= item.step;
              const isCurrent = dispatchStep === item.step;
              return (
                <div key={item.step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  {item.step < 4 && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '9px',
                      width: '2px',
                      height: 'calc(100% + 4px)',
                      background: dispatchStep > item.step ? '#ef4444' : 'var(--border-light)',
                      transition: 'background-color 0.3s'
                    }} />
                  )}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isActive ? '#ef4444' : 'var(--bg-body)',
                    border: isActive ? 'none' : '2px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    zIndex: 2,
                    boxShadow: isCurrent ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                    animation: isCurrent ? 'pulse 1s infinite alternate' : 'none'
                  }}>
                    {dispatchStep > item.step ? '✓' : item.step}
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 'bold', color: isActive ? 'var(--text-dark)' : 'var(--text-gray)' }}>
                      {item.title}
                    </h5>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="sell-submit-btn" style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-dark)', padding: '10px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setSelectedService(null)}>Cancel Request / Select Different</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
          {[
            { label: 'Towing Service', icon: '🚛' },
            { label: 'Flat Tyre Support', icon: '🔧' },
            { label: 'Battery Jumpstart', icon: '⚡' },
            { label: 'Fuel Delivery', icon: '⛽' }
          ].map(item => (
            <button key={item.label} onClick={() => triggerRsa(item.label)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-gray)', marginTop: '12px' }}>
        <span>Emergency Toll-Free Hotline:</span>
        <strong style={{ color: '#ff5a00', fontSize: '0.9rem' }}>1800-102-4567</strong>
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

export default RsaModal;
