const OffersModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const offers = [
    { title: 'Zero Down Payment', brand: 'Maruti Suzuki', validity: 'Valid till 30 June 2025', details: 'No down payment required on WagonR, Baleno, and Dzire. Finance 100% ex-showroom price.', badge: '🎁 Limited Offer', badgeColor: '#ff5a00' },
    { title: 'Free 3-Year Warranty Extension', brand: 'Hyundai', validity: 'On all 2025 models', details: 'Get 3 additional years of manufacturer warranty on top of standard 3+2 warranty. Only on booking before June end.', badge: '🛡️ Warranty Deal', badgeColor: '#3b82f6' },
    { title: 'Exchange Bonus ₹75,000', brand: 'Tata Motors', validity: 'Monsoon Season Sale', details: 'Get ₹75,000 exchange benefit over market value when you swap your existing car for Nexon, Harrier, or Punch.', badge: '💱 Exchange Offer', badgeColor: '#10b981' },
    { title: 'EV Subsidy: ₹1.5 Lakh Off', brand: 'Mahindra', validity: 'Government FAME-II Benefit', details: 'FAME subsidy directly passed to customer on BE6e and XEV9e models. Additional corporate discount for employees.', badge: '⚡ EV Benefit', badgeColor: '#8b5cf6' }
  ];

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Exclusive Brand Offers</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Exclusive Brand Offers</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Curated manufacturer deals and seasonal promotions for 2025.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
        {offers.map(offer => (
          <div key={offer.title} style={{ padding: '14px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{offer.title}</h4>
              <span style={{ padding: '3px 8px', borderRadius: '12px', background: offer.badgeColor, color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '8px' }}>{offer.badge}</span>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#ff5a00', marginBottom: '4px' }}>{offer.brand}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginBottom: '6px', lineHeight: '1.4' }}>{offer.details}</div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '600' }}>📅 {offer.validity}</div>
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

export default OffersModal;
