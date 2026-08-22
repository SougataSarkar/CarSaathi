const LoanSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">CarSaathi Finance Edge</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">📈</span>
        <div>
          <h4 className="sidebar-feature-title">Lowest Interest Rates</h4>
          <p className="sidebar-feature-desc">Get special corporate rates starting at 8.45% p.a. through integrations with HDFC, ICICI, SBI, and Axis Bank.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">⏱️</span>
        <div>
          <h4 className="sidebar-feature-title">Instant E-Approval</h4>
          <p className="sidebar-feature-desc">Skip long bank queues. Get digital loan approval letter generated in under 15 minutes by verified details.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">💰</span>
        <div>
          <h4 className="sidebar-feature-title">Zero Foreclosure Fees</h4>
          <p className="sidebar-feature-desc">Select bank offers provide flexible repayment terms with zero penalties for prepayments after 12 months.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <div style={{ flex: 1, borderRight: '1px solid var(--border-light)' }}>
        <div className="sidebar-stat-number" style={{ fontSize: '1.4rem' }}>₹0</div>
        <p className="sidebar-stat-label">Processing Fee Option</p>
      </div>
      <div style={{ flex: 1 }}>
        <div className="sidebar-stat-number" style={{ fontSize: '1.4rem', color: '#10b981' }}>100%</div>
        <p className="sidebar-stat-label">On-Road Funding</p>
      </div>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "Calculated my eligibility and applied online. CarSaathi team coordinated everything with SBI, and the loan amount was sanctioned in 24 hours with zero physical paperwork!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Priya Sharma, Delhi</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>🤵</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Finance Advisor</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Vikram: <strong>+91 98765 43211</strong></span>
      </div>
    </div>
  </div>
);

export default LoanSidebarInfo;
