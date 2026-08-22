import { useState } from 'react';

const EligibilityModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [salary, setSalary] = useState(50000);
  const [obligations, setObligations] = useState(0);
  const [tenure, setTenure] = useState(5);
  const [rate, setRate] = useState(9.5);
  const [result, setResult] = useState<{ maxEmi: number; loanAmt: number; creditPct: number } | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const foir = 0.50;
    const maxEmi = Math.round(salary * foir - obligations);
    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;
    const loanAmt = Math.round(maxEmi * (Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months)));
    const creditPct = Math.min(100, Math.round((obligations / (salary * 0.5)) * 100));
    setResult({ maxEmi, loanAmt, creditPct });
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Loan Eligibility Calculator</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Loan Eligibility Calculator</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Know the maximum car loan you qualify for based on your salary.</p>
      </div>

      {result ? (
        <div style={{ textAlign: 'center', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, padding: '16px', background: 'rgba(255, 90, 0, 0.06)', borderRadius: '10px', border: '1px solid rgba(255, 90, 0, 0.12)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '6px' }}>Max EMI Capacity</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ff5a00' }}>₹{result.maxEmi.toLocaleString('en-IN')}/mo</div>
            </div>
            <div style={{ flex: 1, padding: '16px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.12)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '6px' }}>Loan Eligible For</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>₹{(result.loanAmt / 100000).toFixed(2)} L</div>
            </div>
          </div>

          <div style={{ textAlign: 'left', background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '8px' }}>Debt-to-Income Ratio</div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '10px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: `${result.creditPct}%`, height: '100%', background: result.creditPct > 70 ? '#ef4444' : result.creditPct > 40 ? '#f59e0b' : '#10b981', borderRadius: '10px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Utilisation: <strong>{result.creditPct}%</strong></span>
              <span style={{ color: result.creditPct > 70 ? '#ef4444' : result.creditPct > 40 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                {result.creditPct > 70 ? 'High Debt Load' : result.creditPct > 40 ? 'Moderate' : 'Healthy'}
              </span>
            </div>
          </div>

          <button className="sell-submit-btn" style={{ background: '#ff5a00', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setResult(null)}>Recalculate</button>
        </div>
      ) : (
        <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Monthly Net Salary: ₹{salary.toLocaleString('en-IN')}</label>
            <input type="range" min={15000} max={500000} step={5000} value={salary} onChange={e => setSalary(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ff5a00', marginTop: '6px' }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Existing EMI/Loan Obligations: ₹{obligations.toLocaleString('en-IN')}</label>
            <input type="range" min={0} max={100000} step={1000} value={obligations} onChange={e => setObligations(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ff5a00', marginTop: '6px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Loan Tenure</label>
              <select value={tenure} onChange={e => setTenure(parseInt(e.target.value))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(y => <option key={y} value={y}>{y} Year{y > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Interest Rate (%)</label>
              <input type="number" step="0.1" min={6} max={20} value={rate} onChange={e => setRate(parseFloat(e.target.value))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Calculate Eligibility</button>
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
          maxWidth: '420px',
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

export default EligibilityModal;
