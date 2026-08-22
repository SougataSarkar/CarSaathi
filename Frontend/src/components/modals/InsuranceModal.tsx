import { useState } from 'react';

const InsuranceModal = ({ onClose, onToast, isPage }: { onClose?: () => void; onToast: (msg: string, type: 'success' | 'error' | 'info') => void; isPage?: boolean }) => {
  const [regNo, setRegNo] = useState('');
  const [phone, setPhone] = useState('');
  const [insurer, setInsurer] = useState('Digit');
  const [premium, setPremium] = useState<number | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const factor = regNo.length > 5 ? parseInt(regNo.slice(-2)) || 45 : 32;
    const computedPremium = Math.max(4500, 3000 + factor * 110);
    setPremium(computedPremium);
  };

  const handlePay = () => {
    onToast(`Insurance Policy for ${regNo.toUpperCase()} renewed successfully! Documents sent to email.`, 'success');
    if (onClose) onClose();
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Insurance Renewal Portal</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Insurance Renewal Portal</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Renew your car insurance policy instantly with zero paperwork.</p>
      </div>

      {premium !== null ? (
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>Calculated Annual Premium</span>
          <h2 style={{ color: '#10b981', fontSize: '1.8rem', margin: 0, fontWeight: '800' }}>
            ₹{premium.toLocaleString('en-IN')} /yr
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Includes comprehensive damage cover, 3rd party liability & zero-depreciation rider benefit.</p>
          <button className="sell-submit-btn" style={{ marginTop: '16px', background: '#10b981', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: 'bold' }} onClick={handlePay}>Confirm & Pay Premium</button>
          <button className="sell-submit-btn" style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-dark)', padding: '8px 14px', borderRadius: 'var(--radius-input)', cursor: 'pointer' }} onClick={() => setPremium(null)}>Calculate Another</button>
        </div>
      ) : (
        <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Vehicle Registration No.</label>
            <input type="text" placeholder="e.g. DL 3C AY 4567" value={regNo} onChange={e => setRegNo(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Mobile Number</label>
            <input type="tel" pattern="[0-9]{10}" placeholder="Enter 10-digit number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Previous Insurer</label>
            <select value={insurer} onChange={e => setInsurer(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              <option value="Digit">Digit Insurance</option>
              <option value="HDFC Ergo">HDFC Ergo General</option>
              <option value="ICICI Lombard">ICICI Lombard</option>
              <option value="SBI General">SBI General Insurance</option>
            </select>
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Calculate Premium</button>
        </form>
      )}
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
          maxWidth: '400px',
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

export default InsuranceModal;
