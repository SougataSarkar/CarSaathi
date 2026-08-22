import { useState } from 'react';

const CompareModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [bankA, setBankA] = useState('HDFC Bank');
  const [bankB, setBankB] = useState('SBI Bank');
  const [loanAmt, setLoanAmt] = useState(500000);
  const [tenure, setTenure] = useState(5);

  const bankData: Record<string, { rate: number; processingFee: string; prepayment: string; approval: string; minIncome: string }> = {
    'HDFC Bank': { rate: 8.75, processingFee: '0.5% (Min ₹3,500)', prepayment: '2.5% after 6 months', approval: '15 minutes (Digital)', minIncome: '₹25,000/mo' },
    'SBI Bank': { rate: 8.45, processingFee: 'Nil for YONO users', prepayment: 'Zero after 12 months', approval: '24-48 hours', minIncome: '₹20,000/mo' },
    'ICICI Bank': { rate: 9.00, processingFee: '0.5% of loan amount', prepayment: '3% within first year', approval: '20 minutes (Online)', minIncome: '₹25,000/mo' },
    'Axis Bank': { rate: 8.80, processingFee: '1% + GST', prepayment: '2% within 24 months', approval: '30 minutes (Digital)', minIncome: '₹22,000/mo' },
    'Kotak Bank': { rate: 9.25, processingFee: '₹4,999 flat fee', prepayment: 'Free after 12 months', approval: '45 minutes', minIncome: '₹30,000/mo' }
  };

  const calculateEmi = (rate: number) => {
    const r = rate / 12 / 100;
    const n = tenure * 12;
    return Math.round(loanAmt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  };

  const allBanks = Object.keys(bankData);
  const metrics = ['rate', 'processingFee', 'prepayment', 'approval', 'minIncome'] as const;
  const metricLabels: Record<string, string> = { rate: 'Interest Rate (p.a.)', processingFee: 'Processing Fee', prepayment: 'Prepayment Terms', approval: 'Approval Time', minIncome: 'Min. Income Required' };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Compare Car Loan Banks</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Compare Car Loan Banks</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Real-time rate comparison across top Indian lending banks.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <select value={bankA} onChange={e => setBankA(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', fontWeight: '600', fontSize: '0.82rem' }}>
          {allBanks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-gray)' }}>vs</div>
        <select value={bankB} onChange={e => setBankB(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', fontWeight: '600', fontSize: '0.82rem' }}>
          {allBanks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-gray)', fontWeight: '700' }}>Loan Amount: ₹{(loanAmt / 100000).toFixed(1)}L</label>
          <input type="range" min={100000} max={5000000} step={50000} value={loanAmt} onChange={e => setLoanAmt(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ff5a00', marginTop: '4px' }} />
        </div>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-gray)', fontWeight: '700' }}>Tenure: {tenure} Yrs</label>
          <input type="range" min={1} max={7} step={1} value={tenure} onChange={e => setTenure(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ff5a00', marginTop: '4px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {[bankA, bankB].map(bank => (
          <div key={bank} style={{ flex: 1, padding: '12px', background: 'rgba(255, 90, 0, 0.06)', borderRadius: '8px', border: '1px solid rgba(255, 90, 0, 0.15)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginBottom: '4px' }}>EMI – {bank.replace(' Bank', '')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ff5a00' }}>₹{calculateEmi(bankData[bank]?.rate || 9).toLocaleString('en-IN')}/mo</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
        <div style={{ display: 'flex', padding: '6px 8px', borderRadius: '4px', background: 'rgba(255, 90, 0, 0.07)', fontSize: '0.75rem', fontWeight: '700', color: '#ff5a00' }}>
          <span style={{ flex: 1 }}>Parameter</span>
          <span style={{ flex: 1 }}>{bankA}</span>
          <span style={{ flex: 1 }}>{bankB}</span>
        </div>
        {metrics.map((metric, i) => (
          <div key={metric} style={{ display: 'flex', padding: '8px', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-dark)', background: i % 2 === 0 ? 'var(--bg-body)' : 'transparent' }}>
            <span style={{ flex: 1, color: 'var(--text-gray)', fontWeight: '600' }}>{metricLabels[metric]}</span>
            <span style={{ flex: 1 }}>{metric === 'rate' ? `${bankData[bankA][metric]}%` : bankData[bankA][metric]}</span>
            <span style={{ flex: 1 }}>{metric === 'rate' ? `${bankData[bankB][metric]}%` : bankData[bankB][metric]}</span>
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
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
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

export default CompareModal;
