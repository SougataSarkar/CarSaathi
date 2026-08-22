import { useState } from 'react';

const CompareNewModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [carA, setCarA] = useState('Hyundai Creta');
  const [carB, setCarB] = useState('Kia Seltos');

  const carData: Record<string, Record<string, string>> = {
    'Hyundai Creta': { Price: '₹11.11 – ₹20.45 L', Engine: '1.5L Petrol/Diesel/Hybrid', Power: '115 bhp / 160 bhp', Mileage: '17.4 – 21.4 kmpl', Boot: '433 L', 'Safety Stars': '5 ★ (NCAP)', Display: '10.25" HD + 10.25" Cluster' },
    'Kia Seltos': { Price: '₹10.89 – ₹20.15 L', Engine: '1.5L Petrol/Diesel/Turbo', Power: '115 bhp / 163 bhp', Mileage: '16.5 – 21.6 kmpl', Boot: '433 L', 'Safety Stars': '5 ★ (NCAP)', Display: '10.25" HD + 10.25" Cluster' },
    'Tata Nexon': { Price: '₹8.10 – ₹15.50 L', Engine: '1.2L Petrol/1.5L Diesel', Power: '120 bhp / 114 bhp', Mileage: '17.1 – 24.1 kmpl', Boot: '350 L', 'Safety Stars': '5 ★ (GNCAP)', Display: '12.3" HD Touchscreen' },
    'Maruti Brezza': { Price: '₹8.34 – ₹14.14 L', Engine: '1.5L Petrol (Mild Hybrid)', Power: '103 bhp', Mileage: '19.89 – 25.51 kmpl', Boot: '328 L', 'Safety Stars': '4 ★ (GNCAP)', Display: '9" Smartplay Pro+' },
    'Toyota Hyryder': { Price: '₹11.14 – ₹19.49 L', Engine: '1.5L Petrol Hybrid', Power: '92 bhp + Motor', Mileage: '23.0 – 27.97 kmpl', Boot: '373 L', 'Safety Stars': '5 ★ (GNCAP)', Display: '9" Touchscreen' }
  };

  const allCars = Object.keys(carData);
  const metrics = Object.keys(carData['Hyundai Creta']);

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Compare New Cars</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Compare New Cars</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Side-by-side specification comparison across top car models.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <select value={carA} onChange={e => setCarA(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', fontWeight: '600' }}>
          {allCars.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--text-gray)', padding: '0 4px' }}>vs</div>
        <select value={carB} onChange={e => setCarB(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', fontWeight: '600' }}>
          {allCars.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', marginTop: '8px' }}>
        <div style={{ display: 'flex', padding: '6px 8px', borderRadius: '4px', background: 'rgba(255, 90, 0, 0.07)', fontSize: '0.78rem', fontWeight: '700', color: '#ff5a00' }}>
          <span style={{ flex: 1 }}>Specification</span>
          <span style={{ flex: 1 }}>{carA}</span>
          <span style={{ flex: 1 }}>{carB}</span>
        </div>
        {metrics.map((metric, i) => (
          <div key={metric} style={{ display: 'flex', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-dark)', background: i % 2 === 0 ? 'var(--bg-body)' : 'transparent', alignItems: 'flex-start', gap: '4px' }}>
            <span style={{ flex: 1, color: 'var(--text-gray)', fontWeight: '600' }}>{metric}</span>
            <span style={{ flex: 1 }}>{carData[carA]?.[metric] || '—'}</span>
            <span style={{ flex: 1 }}>{carData[carB]?.[metric] || '—'}</span>
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
          gap: '12px',
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

export default CompareNewModal;
