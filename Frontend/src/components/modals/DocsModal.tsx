const DocsModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const docCategories = [
    {
      category: 'Identity Proof',
      description: 'Any one of the below',
      icon: '🪪',
      docs: ['Aadhaar Card (Mandatory — also serves as address proof)', 'Passport (valid, recent photo)', 'Voter ID Card', 'Driving Licence (with photo)']
    },
    {
      category: 'Address Proof',
      description: 'Any one of the below',
      icon: '🏠',
      docs: ['Aadhaar Card', 'Passport (Home address page)', 'Utility bills – Electricity, Telephone (< 3 months)', 'Rent Agreement (notarised copy)']
    },
    {
      category: 'Income Proof',
      description: 'For salaried applicants',
      icon: '💼',
      docs: ['Last 3 months salary slips', 'Form 16 (current year)', 'Bank account statements – 3 months', 'Employment Letter from Employer']
    },
    {
      category: 'Vehicle Documents',
      description: 'Required before disbursal',
      icon: '🚗',
      docs: ['RC Book (Registration Certificate)', 'Insurance Certificate', 'Inspection Report from CarSaathi', 'Quotation / Proforma Invoice (from seller)']
    }
  ];

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Loan Documents Checklist</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Loan Documents Checklist</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Complete list of documents required for car loan processing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
        {docCategories.map(cat => (
          <div key={cat.category} style={{ background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', background: 'rgba(255, 90, 0, 0.05)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{cat.category}</h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>{cat.description}</span>
              </div>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cat.docs.map((doc, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: '1.3' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold', marginTop: '1px', flexShrink: 0 }}>✓</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 12px', background: 'rgba(255, 90, 0, 0.05)', borderRadius: '8px', border: '1px dashed rgba(255, 90, 0, 0.2)', fontSize: '0.76rem', color: 'var(--text-gray)', lineHeight: '1.5' }}>
        📌 <strong>Tip:</strong> For faster processing, digitise your documents in advance. Scanned PDF format or high-resolution JPG files (max 5 MB per document) are accepted via the app upload screen.
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

export default DocsModal;
