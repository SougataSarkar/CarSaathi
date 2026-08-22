import { useState } from 'react';
import { API_URL } from '../../utils/apiConfig';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    identifier: '',
    role: 'Customer'
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCodeTyped, setOtpCodeTyped] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSendOtp = async () => {
    if (!authForm.phone.trim() || authForm.phone.trim().length < 8) {
      setAuthError("Please enter a valid phone number before sending OTP.");
      return;
    }

    setIsOtpLoading(true);
    setAuthError(null);
    setOtpInfoMessage(null);

    const baseApiUrl = API_URL;
    try {
      const res = await fetch(`${baseApiUrl}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: authForm.phone })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtpInfoMessage(`Simulated OTP sent! Please use code: ${data.otp}`);
    } catch (err: any) {
      setAuthError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCodeTyped.trim()) {
      setAuthError("Please enter the 6-digit OTP code.");
      return;
    }

    setIsOtpLoading(true);
    setAuthError(null);

    const baseApiUrl = API_URL;
    try {
      const res = await fetch(`${baseApiUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: authForm.phone, otp: otpCodeTyped })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP code");
      }

      setIsOtpVerified(true);
      setOtpInfoMessage("Phone number verified successfully! ✓");
    } catch (err: any) {
      setAuthError(err.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const baseApiUrl = API_URL;

    if (authMode === 'register') {
      if (!isOtpVerified) {
        setAuthError("Please verify your phone number via OTP first.");
        return;
      }
      if (!authForm.name.trim()) {
        setAuthError("Name is required.");
        return;
      }
      if (!authForm.email.trim()) {
        setAuthError("Email is required.");
        return;
      }
      if (!authForm.password) {
        setAuthError("Password is required.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }

      try {
        const res = await fetch(`${baseApiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: authForm.name,
            email: authForm.email,
            phone: authForm.phone,
            password: authForm.password,
            role: authForm.role
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }

        onSuccess(data.token, data.user);
        onClose();
      } catch (err: any) {
        setAuthError(err.message || "Failed to register. Please try again.");
      }
    } else {
      if (!authForm.identifier.trim()) {
        setAuthError("Email or phone number is required.");
        return;
      }
      if (!authForm.password) {
        setAuthError("Password is required.");
        return;
      }

      try {
        const res = await fetch(`${baseApiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: authForm.identifier,
            password: authForm.password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        onSuccess(data.token, data.user);
        onClose();
      } catch (err: any) {
        setAuthError(err.message || "Invalid email/phone number or password.");
      }
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>

        <div className="auth-modal-header">
          <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{authMode === 'login' ? 'Sign in to access your pre-owned car wishlist and loans' : 'Register to save custom price searches and loans'}</p>
        </div>

        {authError && (
          <div className="auth-error-banner">
            ⚠️ {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                type="text"
                id="auth-name"
                name="name"
                placeholder="Enter your name"
                value={authForm.name}
                onChange={handleAuthChange}
                required
              />
            </div>
          )}

          {authMode === 'login' ? (
            <div className="form-group">
              <label htmlFor="auth-identifier">Email or Phone Number</label>
              <input
                type="text"
                id="auth-identifier"
                name="identifier"
                placeholder="Email or phone number"
                value={authForm.identifier}
                onChange={handleAuthChange}
                required
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  type="email"
                  id="auth-email"
                  name="email"
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="auth-phone">Phone Number</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="tel"
                    id="auth-phone"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={authForm.phone}
                    onChange={handleAuthChange}
                    disabled={otpSent || isOtpVerified}
                    required
                    style={{ flexGrow: 1 }}
                  />
                  {!isOtpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isOtpLoading || !authForm.phone}
                      className="auth-submit-btn"
                      style={{ width: 'auto', padding: '0 15px', margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap', backgroundColor: 'var(--orange)' }}
                    >
                      {isOtpLoading ? '⏳...' : otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && !isOtpVerified && (
                <div className="form-group" style={{ background: 'rgba(255, 111, 84, 0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--orange)' }}>
                  <label htmlFor="auth-otp" style={{ color: 'var(--orange)', fontWeight: 'bold' }}>Enter OTP Code</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input
                      type="text"
                      id="auth-otp"
                      placeholder="6-digit code"
                      value={otpCodeTyped}
                      onChange={(e) => setOtpCodeTyped(e.target.value)}
                      style={{ flexGrow: 1, padding: '8px', border: '1px solid rgba(255, 111, 84, 0.3)', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isOtpLoading}
                      className="auth-submit-btn"
                      style={{ width: 'auto', padding: '0 15px', margin: 0, fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white' }}
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>
              )}

              {otpInfoMessage && (
                <div style={{
                  fontSize: '0.8rem',
                  color: isOtpVerified ? '#10b981' : 'var(--orange)',
                  padding: '8px 12px',
                  background: isOtpVerified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 111, 84, 0.08)',
                  border: `1px solid ${isOtpVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 111, 84, 0.2)'}`,
                  borderRadius: '6px',
                  marginTop: '5px',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  {otpInfoMessage}
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              type="password"
              id="auth-password"
              name="password"
              placeholder="Enter your password"
              value={authForm.password}
              onChange={handleAuthChange}
              required
            />
          </div>

          {authMode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="auth-confirm-password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={authForm.confirmPassword}
                  onChange={handleAuthChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="auth-role">Account Type</label>
                <select
                  id="auth-role"
                  name="role"
                  value={authForm.role}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-dark)',
                    fontSize: '0.95rem',
                    marginTop: '4px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Customer" style={{ background: 'var(--bg-card)', color: 'var(--text-dark)' }}>Customer</option>
                  <option value="Dealer" style={{ background: 'var(--bg-card)', color: 'var(--text-dark)' }}>Dealer</option>
                  <option value="Admin" style={{ background: 'var(--bg-card)', color: 'var(--text-dark)' }}>Admin</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={authMode === 'register' && !isOtpVerified}
            style={authMode === 'register' && !isOtpVerified ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {authMode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="auth-modal-footer">
          {authMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                  setOtpSent(false);
                  setOtpCodeTyped('');
                  setIsOtpVerified(false);
                  setOtpInfoMessage(null);
                }}
                className="auth-switch-link"
              >
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setOtpSent(false);
                  setOtpCodeTyped('');
                  setIsOtpVerified(false);
                  setOtpInfoMessage(null);
                }}
                className="auth-switch-link"
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
