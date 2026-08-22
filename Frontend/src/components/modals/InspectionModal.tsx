import { useState } from 'react';

const InspectionModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [form, setForm] = useState({ name: '', phone: '', city: 'Delhi', date: '', time: '10:00 AM - 12:00 PM' });
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
          <h2>Book Vehicle Inspection</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Book Vehicle Inspection</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Schedule a certified engineer to evaluate your car at home.</p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 90, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5a00', fontSize: '2rem' }}>✓</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Inspection Scheduled!</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.4' }}>
            We will contact you shortly on <strong>{form.phone}</strong> to confirm your slot on <strong>{form.date}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Phone Number</label>
            <input type="tel" pattern="[0-9]{10}" placeholder="Enter 10-digit number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Inspection City</label>
            <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              {['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Kolkata', 'Chennai', 'Hyderabad'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Inspection Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Time Slot</label>
            <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              <option>10:00 AM - 12:00 PM</option>
              <option>12:00 PM - 02:00 PM</option>
              <option>02:00 PM - 04:00 PM</option>
              <option>04:00 PM - 06:00 PM</option>
            </select>
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Schedule Free Inspection</button>
        </form>
      )}
    </>
  );

  if (isPage) {
    return (
      <div className="services-list-left" style={{ maxWidth: '500px', margin: '0 auto', width: '100%', float: 'none', background: 'var(--bg-card)', padding: '32px 24px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
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

export default InspectionModal;
