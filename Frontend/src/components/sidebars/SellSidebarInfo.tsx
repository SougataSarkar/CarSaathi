const SellSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">Why Sell with CarSaathi?</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">⚡</span>
        <div>
          <h4 className="sidebar-feature-title">Instant Value Quotation</h4>
          <p className="sidebar-feature-desc">Our proprietary machine learning algorithm evaluates 200+ price checkpoints to give accurate market valuations in 10 seconds.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🛡️</span>
        <div>
          <h4 className="sidebar-feature-title">Free RC Transfer & Paperwork</h4>
          <p className="sidebar-feature-desc">Complete legal ownership transfer and documentation handled entirely by CarSaathi legal team at zero cost.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🤝</span>
        <div>
          <h4 className="sidebar-feature-title">1-Visit Payment Sanction</h4>
          <p className="sidebar-feature-desc">Once inspection is done at your doorstep, transaction amount is credited directly to your bank account via IMPS/NEFT instantly.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card">
      <div className="sidebar-stat-number">4.8 ★</div>
      <p className="sidebar-stat-label">Rated by over 1,50,000+ happy car sellers in India</p>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "Got ₹45,000 higher than local dealerships. The doorstep inspection team was super professional, and the payment was credited to my account before they even left my house!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Rohan Mehra, Mumbai</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>👩‍💼</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Sell Advisor</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Riya: <strong>+91 98765 43210</strong></span>
      </div>
    </div>
  </div>
);

export default SellSidebarInfo;
