import { useState } from 'react';

const BookTestDriveModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [form, setForm] = useState({ name: '', phone: '', city: 'Delhi', carName: '', date: '' });
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

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Book New Car Test Drive</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Book New Car Test Drive</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Get a home test drive for any new car from top manufacturers.</p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 90, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5a00', fontSize: '2rem' }}>✓</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Test Drive Confirmed!</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.4' }}>
            A dealership executive will visit <strong>{form.name}</strong> with the <strong>{form.carName}</strong> on <strong>{form.date}</strong> in <strong>{form.city}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Car Model</label>
            <select value={form.carName} onChange={e => setForm({ ...form, carName: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required>
              <option value="">Select car model</option>
              {['Hyundai Creta', 'Kia Seltos', 'Tata Nexon', 'Tata Harrier', 'Maruti Brezza', 'Toyota Hyryder', 'Skoda Slavia', 'Volkswagen Virtus', 'Mahindra XUV700', 'Maruti e-Vitara'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Phone Number</label>
            <input type="tel" pattern="[0-9]{10}" placeholder="10-digit number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>City</label>
            <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              {['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Kolkata', 'Chennai', 'Hyderabad'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Preferred Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} min={new Date().toISOString().split('T')[0]} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Book Home Test Drive</button>
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

export default BookTestDriveModal;
