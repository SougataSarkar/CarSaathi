import { useState } from 'react';

const ValuationModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [make, setMake] = useState('Maruti Suzuki');
  const [year, setYear] = useState(2020);
  const [km, setKm] = useState(40000);
  const [condition, setCondition] = useState('Good');
  const [valuation, setValuation] = useState<number | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    let basePrice = 800000;
    if (['BMW', 'Audi', 'Mercedes-Benz'].includes(make)) basePrice = 4500000;
    else if (['Toyota', 'Mahindra'].includes(make)) basePrice = 1800000;
    else if (['Honda', 'Hyundai'].includes(make)) basePrice = 1000000;

    const age = 2026 - year;
    const depreciation = Math.pow(0.88, age);
    const kmPenalty = Math.max(0.7, 1 - (km / 300000));
    let conditionFactor = 1.0;
    if (condition === 'Excellent') conditionFactor = 1.1;
    if (condition === 'Fair') conditionFactor = 0.85;

    const finalVal = Math.round(basePrice * depreciation * kmPenalty * conditionFactor);
    setValuation(Math.max(150000, finalVal));
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Free Car Valuation</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Free Car Valuation</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Estimate the true resale price of your car instantly.</p>
      </div>

      {valuation !== null ? (
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-gray)' }}>Estimated Resale Value</span>
          <h2 style={{ color: '#ff5a00', fontSize: '2.5rem', margin: 0, fontWeight: '800', background: 'linear-gradient(135deg, #ff5a00, #ff8a00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ₹{(valuation / 100000).toFixed(2)} Lakh
          </h2>
          <div style={{ padding: '4px 12px', background: 'rgba(255, 90, 0, 0.06)', borderRadius: '20px', display: 'inline-block', margin: '0 auto', fontSize: '0.85rem', color: '#ff5a00', fontWeight: 'bold' }}>
            Range: ₹{Math.round(valuation * 0.93 / 100000).toFixed(2)}L - ₹{Math.round(valuation * 1.05 / 100000).toFixed(2)}L
          </div>

          <div style={{ marginTop: '16px', background: 'var(--bg-body)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: 'var(--text-dark)', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Price Breakdown Metrics</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
              <span>Base Estimated Value (Brand Category):</span>
              <strong style={{ color: 'var(--text-dark)' }}>₹{['BMW', 'Audi', 'Mercedes-Benz'].includes(make) ? '45.00' : ['Toyota', 'Mahindra'].includes(make) ? '18.00' : ['Honda', 'Hyundai'].includes(make) ? '10.00' : '8.00'} Lakh</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
              <span>Vehicle Age Depreciation ({(2026 - year)} Years):</span>
              <strong style={{ color: '#ef4444' }}>- {Math.round((1 - Math.pow(0.88, 2026 - year)) * 100)}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
              <span>Odometer Usage Penalty ({km.toLocaleString()} km):</span>
              <strong style={{ color: '#ef4444' }}>- {Math.round((1 - Math.max(0.7, 1 - (km / 300000))) * 100)}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
              <span>Condition Factor adjustment ({condition}):</span>
              <strong style={{ color: condition === 'Excellent' ? '#10b981' : condition === 'Fair' ? '#ef4444' : 'var(--text-dark)' }}>
                {condition === 'Excellent' ? '+10%' : condition === 'Fair' ? '-15%' : '0%'}
              </strong>
            </div>
          </div>

          <button className="sell-submit-btn" style={{ marginTop: '16px', background: '#ff5a00', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setValuation(null)}>Calculate Another</button>
        </div>
      ) : (
        <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Select Make / Brand</label>
            <select value={make} onChange={e => setMake(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              {['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Mahindra', 'Toyota', 'Volkswagen', 'Skoda', 'BMW', 'Audi', 'Mercedes-Benz'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Year of Manufacture</label>
            <input type="number" min="2010" max="2026" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Kilometers Driven</label>
            <input type="number" min="0" max="200000" value={km} onChange={e => setKm(parseInt(e.target.value))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              <option value="Excellent">Excellent (Scratchless, perfect mechanicals)</option>
              <option value="Good">Good (Minor wear, well maintained)</option>
              <option value="Fair">Fair (Scratches/dents, needs service)</option>
            </select>
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Calculate Valuation</button>
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

export default ValuationModal;
