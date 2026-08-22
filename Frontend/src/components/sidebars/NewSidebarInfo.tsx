const NewSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">Buy New Cars Smartly</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🚗</span>
        <div>
          <h4 className="sidebar-feature-title">Dealership Price Guarantee</h4>
          <p className="sidebar-feature-desc">We fetch live quotes from all authorized brand dealerships in your city to present the lowest on-road price.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🎁</span>
        <div>
          <h4 className="sidebar-feature-title">Exclusive Online Benefits</h4>
          <p className="sidebar-feature-desc">Book through CarSaathi to gain corporate discounts, accessory packages, and priority delivery timelines.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">⚡</span>
        <div>
          <h4 className="sidebar-feature-title">EV Transition Support</h4>
          <p className="sidebar-feature-desc">Get assistance with home charger setups, state subsidy applications, and green tax benefits calculation.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card">
      <div className="sidebar-stat-number" style={{ color: '#3b82f6' }}>15 Days</div>
      <p className="sidebar-stat-label">Average delivery time limit for premium new models</p>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "Booked a test drive for the new Nexon EV online. Dealership executive brought the car right to my office gate the next afternoon. Extremely prompt and convenient service!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Amit Verma, Bangalore</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>🧑‍💻</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Car Advisor</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Kabir: <strong>+91 98765 43212</strong></span>
      </div>
    </div>
  </div>
);

export default NewSidebarInfo;
