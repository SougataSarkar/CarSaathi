const ServicesSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">CarSaathi Care Promise</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🔩</span>
        <div>
          <h4 className="sidebar-feature-title">100% Genuine OEM Spares</h4>
          <p className="sidebar-feature-desc">All replacement parts are sourced directly from official manufacturer components with verifiable warranty logs.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🚚</span>
        <div>
          <h4 className="sidebar-feature-title">Free Doorstep Pick & Drop</h4>
          <p className="sidebar-feature-desc">Certified service drivers pick up your vehicle from your home/office and drop it back fully serviced and washed.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">📋</span>
        <div>
          <h4 className="sidebar-feature-title">Warranty Intact Servicing</h4>
          <p className="sidebar-feature-desc">Periodic checks conform strictly to dealer standards so that your original vehicle manufacturer warranty remains valid.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card">
      <div className="sidebar-stat-number" style={{ color: '#10b981' }}>10,000 km</div>
      <p className="sidebar-stat-label">Or 6 Months network service warranty on all jobs</p>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "My car broke down late last Friday night. Requested Roadside Assistance via the app and towing truck crew arrived within 22 minutes to tow it to the nearest center. LIFE SAVER!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Sneha Patil, Pune</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>🔧</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Service Manager</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Rahul: <strong>+91 98765 43213</strong></span>
      </div>
    </div>
  </div>
);

export default ServicesSidebarInfo;
