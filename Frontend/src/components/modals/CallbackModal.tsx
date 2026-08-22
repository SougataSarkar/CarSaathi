import { useState } from 'react';

interface CallbackModalProps {
  onClose: () => void;
}

const CallbackModal: React.FC<CallbackModalProps> = ({ onClose }) => {
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [helpText, setHelpText] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isLanguageFocused, setIsLanguageFocused] = useState(false);
  const [isHelpFocused, setIsHelpFocused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          padding: '32px 24px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-card)',
          gap: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <button
          className="auth-modal-close"
          onClick={onClose}
          style={{ top: '16px', right: '20px', fontSize: '1.5rem', color: 'var(--text-gray)' }}
        >
          &times;
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 90, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5a00', fontSize: '2rem' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Callback Requested!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.4' }}>
              Our representative will call you back shortly on <strong>+91 {phone}</strong>.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0, textAlign: 'left' }}>Request call back</h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Phone Number Input */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  border: isPhoneFocused ? '1px solid #ff5a00' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-input)',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-body)',
                  transition: 'border-color 0.2s',
                  marginTop: '8px'
                }}
              >
                <label style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '12px',
                  background: 'var(--bg-card)',
                  padding: '0 4px',
                  fontSize: '0.75rem',
                  color: isPhoneFocused ? '#ff5a00' : 'var(--text-gray)',
                  fontWeight: '600',
                  transition: 'color 0.2s'
                }}>
                  Mobile Number
                </label>
                <span style={{ color: 'var(--text-dark)', marginRight: '8px', fontSize: '0.95rem', fontWeight: '500' }}>+91</span>
                <input
                  type="tel"
                  pattern="[0-9]{10}"
                  placeholder="Enter 10-digit number"
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem', color: 'var(--text-dark)', padding: 0 }}
                  value={phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(val);
                  }}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  required
                />
              </div>

              {/* Language Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Language</label>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    border: isLanguageFocused ? '1px solid #ff5a00' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-input)',
                    backgroundColor: 'var(--bg-body)',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <span style={{ position: 'absolute', left: '14px', color: 'var(--text-gray)', fontSize: '0.9rem' }}>🔍</span>
                  <input
                    type="text"
                    style={{
                      padding: '10px 14px 10px 38px',
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-input)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: 'var(--text-dark)'
                    }}
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    onFocus={() => setIsLanguageFocused(true)}
                    onBlur={() => setIsLanguageFocused(false)}
                    placeholder="Search Language"
                  />
                </div>
              </div>

              {/* Textarea help message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    border: isHelpFocused ? '1px solid #ff5a00' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-input)',
                    backgroundColor: 'var(--bg-body)',
                    transition: 'border-color 0.2s',
                    padding: '8px 12px'
                  }}
                >
                  <textarea
                    style={{
                      width: '100%',
                      height: '90px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: 'var(--text-dark)',
                      resize: 'none',
                      fontFamily: 'inherit',
                      padding: 0
                    }}
                    placeholder="Tell us what you need help with"
                    value={helpText}
                    onChange={e => setHelpText(e.target.value)}
                    onFocus={() => setIsHelpFocused(true)}
                    onBlur={() => setIsHelpFocused(false)}
                  />
                </div>
              </div>

              {/* Notice text */}
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-gray)', margin: '4px 0', lineHeight: '1.5' }}>
                <div>To have a CarSaathi representative call you, please click below</div>
                <div style={{ color: '#ff5a00', fontWeight: '700', marginTop: '4px' }}>We are operational between 9 AM - 9 PM</div>
              </div>

              {/* Call Me Button */}
              <button
                type="submit"
                disabled={phone.length < 10}
                style={{
                  backgroundColor: phone.length < 10 ? 'var(--border-light)' : '#ff5a00',
                  color: phone.length < 10 ? 'var(--text-gray)' : '#ffffff',
                  border: 'none',
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-input)',
                  cursor: phone.length < 10 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s, opacity 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Call Me
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CallbackModal;
