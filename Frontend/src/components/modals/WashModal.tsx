import { useState } from 'react';

const WashModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [selectedPack, setSelectedPack] = useState<'eco' | 'premium' | 'deep'>('premium');
  const [model, setModel] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM - 12:00 PM');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  const getPackPrice = () => {
    if (selectedPack === 'eco') return 399;
    if (selectedPack === 'premium') return 799;
    return 1499;
  };

  const getPackName = () => {
    if (selectedPack === 'eco') return 'Eco Wash';
    if (selectedPack === 'premium') return 'Premium Foam Wash';
    return 'Deep Detailing Spa';
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Car Wash & Detailing</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Car Wash & Detailing</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Professional doorstep washing and complete interior spa detailing.</p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 90, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5a00', fontSize: '2rem' }}>✓</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Wash Booked Successfully!</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.4' }}>
            We have confirmed your <strong>{getPackName()}</strong> (₹{getPackPrice()}) for <strong>{model}</strong> on <strong>{date}</strong>. Our service driver will call you.
          </p>
        </div>
      ) : (
        <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Choose Wash Package</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { type: 'eco', label: 'Eco Wash', price: '₹399' },
                { type: 'premium', label: 'Premium Foam', price: '₹799' },
                { type: 'deep', label: 'Detailing Spa', price: '₹1499' }
              ].map(item => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setSelectedPack(item.type as any)}
                  style={{
                    flex: 1,
                    padding: '12px 6px',
                    borderRadius: '8px',
                    border: selectedPack === item.type ? '2px solid var(--orange)' : '1px solid var(--border-light)',
                    background: selectedPack === item.type ? 'rgba(255, 90, 0, 0.05)' : 'var(--bg-body)',
                    color: selectedPack === item.type ? '#ff5a00' : 'var(--text-dark)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.label}</span>
                  <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>{item.price}</span>
                </button>
              ))}
            </div>
            <div style={{ background: 'var(--bg-body)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.76rem', color: 'var(--text-gray)', marginTop: '4px', border: '1px dashed var(--border-light)' }}>
              {selectedPack === 'eco' && 'Includes: Eco-friendly hand body wash, tyre dressing, foot mat dusting, glass cleaners.'}
              {selectedPack === 'premium' && 'Includes: High-pressure snow foam wash, underbody detailing, engine room wash, dashboard shine.'}
              {selectedPack === 'deep' && 'Includes: Full interior vacuuming, fabric seat wet cleaning, roof & carpet shampooing, dashboard protection.'}
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Car Model / Make</label>
            <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Swift, Creta, City" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }} required />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Preferred Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Preferred Time</label>
              <select value={time} onChange={e => setTime(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}>
                <option>09:00 AM - 11:00 AM</option>
                <option>11:00 AM - 01:00 PM</option>
                <option>01:00 PM - 03:00 PM</option>
                <option>03:00 PM - 05:00 PM</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Mobile Number</label>
              <input type="tel" pattern="[0-9]{10}" placeholder="10 digits" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }} required />
            </div>
          </div>

          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px', width: '100%' }}>Book Doorstep Wash Service</button>
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
          maxWidth: '440px',
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

export default WashModal;
