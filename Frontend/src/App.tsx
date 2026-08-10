import { useState, useEffect } from 'react';
import { formatINR, formatCompactINR, formatGBP } from './currency';
import './App.css';
import { CompanyFooter } from './components/common/CompanyFooter';

const POPULAR_BRANDS = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Mahindra', 'Toyota', 'Volkswagen', 'Skoda', 'BMW', 'Audi', 'Mercedes-Benz'];
const QUICK_BRAND_PILLS = ['City', 'Creta', 'Nexon', 'Seltos', 'Amaze', 'Baleno'];

// Helpers
const parseAndExtractBudget = (query: string): { cleanQuery: string; parsedPrice: { value?: number; min?: number; max?: number } | null } => {
  if (!query) return { cleanQuery: '', parsedPrice: null };

  let cleanQuery = query;
  let parsedPrice: { value?: number; min?: number; max?: number } | null = null;

  // 1. Range match: (between )? 8 to 12 lakh / lacs / cr
  const rangeRegex = /(?:between\s+)?(\d+(?:\.\d+)?)\s*(?:to|and|-|till)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?/i;
  const rangeMatch = query.match(rangeRegex);
  if (rangeMatch) {
    const val1 = parseFloat(rangeMatch[1]);
    const val2 = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3] ? rangeMatch[3].toLowerCase() : 'lakh'; // default to lakh
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      min: val1 * multiplier,
      max: val2 * multiplier
    };
    cleanQuery = query.replace(rangeMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  // 2. Below match: under/below/upto 5 lakh
  const belowRegex = /(?:under|below|up\s*to|upto|less\s*than)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?/i;
  const belowMatch = query.match(belowRegex);
  if (belowMatch) {
    const val = parseFloat(belowMatch[1]);
    const unit = belowMatch[2] ? belowMatch[2].toLowerCase() : 'lakh';
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      value: val * multiplier
    };
    cleanQuery = query.replace(belowMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  // 3. Above match: above/over 5 lakh
  const aboveRegex = /(?:above|over|more\s*than)\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)?/i;
  const aboveMatch = query.match(aboveRegex);
  if (aboveMatch) {
    const val = parseFloat(aboveMatch[1]);
    const unit = aboveMatch[2] ? aboveMatch[2].toLowerCase() : 'lakh';
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      min: val * multiplier,
      max: 50000000
    };
    cleanQuery = query.replace(aboveMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  // 4. Simple single price: 5 lakh, 10L, 1.2 cr
  const singlePriceRegex = /\b(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l|crores?|cr)\b/i;
  const singleMatch = query.match(singlePriceRegex);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    const unit = singleMatch[2].toLowerCase();
    let multiplier = 100000;
    if (unit.startsWith('c')) {
      multiplier = 10000000;
    }
    parsedPrice = {
      value: val * multiplier
    };
    cleanQuery = query.replace(singleMatch[0], '').replace(/\s+/g, ' ').trim();
    return { cleanQuery, parsedPrice };
  }

  return { cleanQuery, parsedPrice };
};

const isPremiumBrand = (make: string) => ['BMW', 'Audi', 'Mercedes-Benz'].includes(make);

const getCarFuelType = (car: any) => {
  if (car.fuel_type) return car.fuel_type;
  if (car.model.toLowerCase().includes('nexon')) return 'Petrol';
  if (['Fortuner', 'Scorpio-N', 'Harrier', 'Safari', 'Thar'].includes(car.model)) return 'Diesel';
  return 'Petrol';
};

const getCarTransmission = (car: any) => {
  if (car.transmission) return car.transmission;
  if (isPremiumBrand(car.make) || car.price > 1800000) return 'Automatic';
  const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
  return carHash % 3 === 0 ? 'Automatic' : 'Manual';
};

const CAR_COLORS = ['White', 'Silver', 'Grey', 'Red', 'Blue', 'Black'];
const getCarColor = (car: any) => {
  const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
  return CAR_COLORS[carHash % CAR_COLORS.length];
};

// State code mapping based on city
const getStateCode = (city: string) => {
  switch (city) {
    case 'Delhi': return 'DL-02';
    case 'Mumbai': return 'MH-02';
    case 'Bangalore': return 'KA-03';
    case 'Kolkata': return 'WB-24';
    case 'Chennai': return 'TN-01';
    case 'Pune': return 'MH-12';
    case 'Hyderabad': return 'TS-09';
    default: return 'IND';
  }
};



const SearchIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', fill: 'currentColor', ...style }}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
  >
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);


const SimilarCarsSection = ({ carId, onSelectCar }: { carId: string; onSelectCar: (id: string) => void }) => {
  const [similarCars, setSimilarCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!carId) return;
    setLoading(true);
    fetch(`${API_URL}/cars/${carId}/similar`)
      .then(res => res.json())
      .then(data => {
        setSimilarCars(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading similar cars:", err);
        setLoading(false);
      });
  }, [carId]);

  if (loading) {
    return (
      <div className="similar-cars-section loading">
        <div className="details-spinner" style={{ margin: '20px auto' }}></div>
        <p style={{ textAlign: 'center', color: 'var(--text-gray)' }}>Finding similar recommendations...</p>
      </div>
    );
  }

  if (similarCars.length === 0) return null;

  return (
    <div className="similar-cars-section">
      <h2 className="similar-cars-title">🚙 Similar Cars You May Like</h2>
      <div className="similar-cars-grid">
        {similarCars.map((car) => {
          return (
            <div 
              key={car.id} 
              className="similar-car-card" 
              onClick={() => {
                onSelectCar(car.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="similar-car-img-wrapper">
                <img src={getCarImageUrl(car)} alt={`${car.make} ${car.model}`} onError={handleImageError} />
                {car.distance !== undefined && car.distance !== null && (
                  <span className="similarity-badge">
                    {Math.round((1 - car.distance) * 100)}% Match
                  </span>
                )}
              </div>
              <div className="similar-car-info">
                <div className="similar-car-price-city">
                  <span className="similar-price">{formatCompactINR(car.price)}</span>
                  <span className="similar-city">📍 {car.city}</span>
                </div>
                <h3>{car.year} {car.make} {car.model}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CAR_IMAGES: Record<number, string> = {
  1: '/images/cars/1.jpg',
  2: '/images/cars/2.jpg',
  3: '/images/cars/3.jpg',
  4: '/images/cars/4.jpg',
  5: '/images/cars/5.jpg',
  6: '/images/cars/6.jpg',
  7: '/images/cars/7.jpg',
  8: '/images/cars/8.jpg',
  9: '/images/cars/9.jpg',
  10: '/images/cars/10.jpg',
  11: '/images/cars/11.jpg',
  12: '/images/cars/12.jpg',
  13: '/images/cars/13.jpg',
  14: '/images/cars/14.jpg',
  15: '/images/cars/15.jpg',
  16: '/images/cars/16.jpg',
  17: '/images/cars/17.jpg',
  18: '/images/cars/18.jpg',
  19: '/images/cars/19.jpg',
  20: '/images/cars/20.jpg',
  21: '/images/cars/21.jpg',
  22: '/images/cars/22.jpg',
  23: '/images/cars/23.jpg',
  24: '/images/cars/24.jpg',
  25: '/images/cars/25.jpg',
  26: '/images/cars/26.jpg',
  27: '/images/cars/27.jpg',
  28: '/images/cars/28.jpg',
  29: '/images/cars/29.jpg',
  30: '/images/cars/30.jpg',
  31: '/images/cars/31.jpg',
  32: '/images/cars/32.jpg',
  33: '/images/cars/33.jpg',
  34: '/images/cars/34.jpg',
  35: '/images/cars/35.jpg',
  36: '/images/cars/36.jpg',
  37: '/images/cars/37.jpg',
  38: '/images/cars/38.jpg',
  39: '/images/cars/39.jpg',
  40: '/images/cars/40.jpg',
  41: '/images/cars/41.jpg',
  42: '/images/cars/42.jpg',
  43: '/images/cars/43.jpg',
  44: '/images/cars/44.jpg',
  45: '/images/cars/45.jpg',
  46: '/images/cars/46.jpg',
  47: '/images/cars/47.jpg',
  48: '/images/cars/48.jpg',
  49: '/images/cars/49.jpg',
  50: '/images/cars/50.jpg'
};
const DEFAULT_CAR_FALLBACK = 'https://images.unsplash.com/photo-1605558202076-76ad227d99d2?auto=format&fit=crop&q=80&w=400';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_CAR_FALLBACK) {
    target.src = DEFAULT_CAR_FALLBACK;
  }
};

const getCarImageUrl = (car: any) => {
  if (!car) return DEFAULT_CAR_FALLBACK;
  if (car.image_url && typeof car.image_url === 'string' && car.image_url.trim()) {
    return car.image_url;
  }
  if (car.id !== undefined && car.id !== null) {
    const numId = Number(car.id);
    if (!isNaN(numId) && CAR_IMAGES[numId]) {
      return CAR_IMAGES[numId];
    }
  }
  return DEFAULT_CAR_FALLBACK;
};

const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Noida': { lat: 28.5355, lng: 77.3910 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ranchi': { lat: 23.3441, lng: 85.3096 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const API_URL = import.meta.env.VITE_API_URL ||
  ((window.location.port === '5173' || window.location.port === '5174' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || /^192\.168\./.test(window.location.hostname) || /^10\./.test(window.location.hostname) || /^172\./.test(window.location.hostname))
    ? `http://${window.location.hostname}:3000`
    : '');

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

const RsaModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [dispatchStep, setDispatchStep] = useState(0);
  const [eta, setEta] = useState(15);

  useEffect(() => {
    if (!selectedService) return;
    setDispatchStep(1);
    setEta(15);

    const stepInterval = setInterval(() => {
      setDispatchStep(prev => {
        if (prev >= 4) {
          clearInterval(stepInterval);
          return 4;
        }
        return prev + 1;
      });
      setEta(prev => Math.max(8, prev - Math.floor(Math.random() * 2) - 1));
    }, 2500);

    return () => clearInterval(stepInterval);
  }, [selectedService]);

  const triggerRsa = (service: string) => {
    setSelectedService(service);
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>24x7 Roadside Assistance</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>24x7 Roadside Assistance</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Stranded on the road? Tap below for instant emergency vehicle dispatch.</p>
      </div>

      {selectedService ? (
        <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.88rem', fontWeight: 'bold' }}>
            🚨 Emergency {selectedService} Unit Requested
          </div>

          {/* Live Progress Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '16px 0', textAlign: 'left', paddingLeft: '10px' }}>
            {[
              { step: 1, title: 'Request Transmitted', desc: 'GPS coordinates shared with regional dispatch center.' },
              { step: 2, title: 'Rescue Crew Assigned', desc: 'Partner towing & technical operator confirmed request.' },
              { step: 3, title: 'Rescue Vehicle Dispatched', desc: 'Crew en-route with required diagnostic machinery.' },
              { step: 4, title: 'Arriving at Destination', desc: `Emergency contact professional will reach you in ~${eta} mins.` }
            ].map(item => {
              const isActive = dispatchStep >= item.step;
              const isCurrent = dispatchStep === item.step;
              return (
                <div key={item.step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  {item.step < 4 && (
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '9px',
                      width: '2px',
                      height: 'calc(100% + 4px)',
                      background: dispatchStep > item.step ? '#ef4444' : 'var(--border-light)',
                      transition: 'background-color 0.3s'
                    }} />
                  )}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isActive ? '#ef4444' : 'var(--bg-body)',
                    border: isActive ? 'none' : '2px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    zIndex: 2,
                    boxShadow: isCurrent ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                    animation: isCurrent ? 'pulse 1s infinite alternate' : 'none'
                  }}>
                    {dispatchStep > item.step ? '✓' : item.step}
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 'bold', color: isActive ? 'var(--text-dark)' : 'var(--text-gray)' }}>
                      {item.title}
                    </h5>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="sell-submit-btn" style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-dark)', padding: '10px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setSelectedService(null)}>Cancel Request / Select Different</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
          {[
            { label: 'Towing Service', icon: '🚛' },
            { label: 'Flat Tyre Support', icon: '🔧' },
            { label: 'Battery Jumpstart', icon: '⚡' },
            { label: 'Fuel Delivery', icon: '⛽' }
          ].map(item => (
            <button key={item.label} onClick={() => triggerRsa(item.label)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-gray)', marginTop: '12px' }}>
        <span>Emergency Toll-Free Hotline:</span>
        <strong style={{ color: '#ff5a00', fontSize: '0.9rem' }}>1800-102-4567</strong>
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

const HistoryModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Vehicle Service History</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Vehicle Service History</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Detailed service history tracker log for your registered cars.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { odo: '22,500 km', date: 'March 14, 2026', type: 'Synthetic Oil Change & AC Filter', cost: '₹ 4,200', status: 'Completed' },
          { odo: '15,000 km', date: 'October 08, 2025', type: 'Wheel Alignment & Tire Rotation', cost: '₹ 1,500', status: 'Completed' },
          { odo: '10,000 km', date: 'April 02, 2025', type: 'Periodic Detailing Spa & Wash', cost: '₹ 2,499', status: 'Completed' }
        ].map((item, idx) => (
          <div key={idx} style={{ borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 2 ? '12px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-dark)' }}>{item.type}</h4>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 'bold' }}>{item.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
              <span>Odometer: <strong>{item.odo}</strong> ({item.date})</span>
              <strong style={{ color: 'var(--text-dark)' }}>{item.cost}</strong>
            </div>
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

const CentersModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [city, setCity] = useState('Delhi');

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Find Nearby Service Centers</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Find Nearby Service Centers</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Locate certified Partner workshop locations.</p>
      </div>

      <div className="form-group" style={{ textAlign: 'left' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Select Workshop City</label>
        <select value={city} onChange={e => setCity(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%' }}>
          {['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Kolkata'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { Delhi: 'CarSaathi Elite Workshop, Connaught Place Sector 4, New Delhi', Mumbai: 'CarSaathi Prime Care, Andheri East Link Road, Mumbai', Bangalore: 'CarSaathi Workshop Hub, Koramangala 8th Block, Bangalore', Pune: 'CarSaathi Care, Viman Nagar Road, Pune', Kolkata: 'CarSaathi Tech Center, Salt Lake Sector V, Kolkata' },
          { Delhi: 'CarSaathi Services, Okhla Industrial Area Phase 3, New Delhi', Mumbai: 'CarSaathi Hub, Borivali West Opp Station, Mumbai', Bangalore: 'CarSaathi Tech Workshop, Whitefield Main Road, Bangalore', Pune: 'CarSaathi Auto Garage, Hinjewadi Phase 1, Pune', Kolkata: 'CarSaathi Care Garage, Gariahat Main Road, Kolkata' }
        ].map((centers: any, idx) => (
          <div key={idx} style={{ borderBottom: idx === 0 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx === 0 ? '12px' : '0' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Workshop Location #{idx + 1}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>{centers[city]}</p>
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

const LaunchesModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Latest Launches (2026)</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Latest Launches (2026)</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Brand new cars recently introduced to the Indian automotive market.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { name: 'Maruti Suzuki Swift 2026', price: '₹ 6.49 - 9.64 Lakhs', date: 'Launched May 2026', desc: 'All-new Z-series engine delivering 25.7 km/l mileage with ADAS safety.' },
          { name: 'Hyundai Creta N Line', price: '₹ 16.82 - 20.45 Lakhs', date: 'Launched June 2026', desc: 'Sportier design, custom N-Line steering, exhaust notes, and 1.5L Turbo petrol.' },
          { name: 'Tata Nexon iCNG', price: '₹ 8.99 - 14.50 Lakhs', date: 'Launched June 2026', desc: 'Indias first turbocharged CNG SUV with panoramic sunroof and twin cylinders.' }
        ].map((item, idx) => (
          <div key={idx} style={{ borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 2 ? '12px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-dark)' }}>{item.name}</h4>
              <span style={{ fontSize: '0.75rem', color: '#ff5a00', fontWeight: 'bold' }}>{item.date}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: '4px' }}>Price: <strong>{item.price}</strong></div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>{item.desc}</p>
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

const CompareNewModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Compare New Cars</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Compare New Cars</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Head-to-head comparison of flagship EVs in India.</p>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', color: 'var(--text-dark)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Features</th>
              <th style={{ padding: '10px 8px', fontWeight: 'bold', color: 'var(--brand)' }}>Tata Nexon EV</th>
              <th style={{ padding: '10px 8px', fontWeight: 'bold', color: 'var(--orange)' }}>Mahindra XUV400</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feature: 'Starting Price', val1: '₹ 14.49 Lakhs', val2: '₹ 15.49 Lakhs' },
              { feature: 'ARAI Range', val1: '465 km', val2: '456 km' },
              { feature: 'Battery Pack', val1: '40.5 kWh', val2: '39.4 kWh' },
              { feature: 'Max Power', val1: '143 PS', val2: '150 PS' },
              { feature: 'Touchscreen Size', val1: '12.3 inches', val2: '10.25 inches' }
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 8px', fontWeight: '500' }}>{row.feature}</td>
                <td style={{ padding: '10px 8px', color: 'var(--brand)' }}>{row.val1}</td>
                <td style={{ padding: '10px 8px', color: 'var(--orange)' }}>{row.val2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (isPage) {
    return (
      <div className="sub-option-page-card-wide">
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
          maxWidth: '500px',
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

const BookTestDriveModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [form, setForm] = useState({ name: '', phone: '', model: 'Tata Curvv EV', city: 'Delhi', date: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    if (onClose) {
      setTimeout(() => onClose(), 2500);
    }
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Book Test Drive</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Book Test Drive</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Schedule a priority dealership test drive for a new car.</p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 90, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5a00', fontSize: '2rem' }}>✓</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>Request Registered!</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', margin: 0, lineHeight: '1.4' }}>
            We have booked your test drive slots for <strong>{form.model}</strong>. Dealership executive will call you to coordinate.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Phone Number</label>
            <input type="tel" pattern="[0-9]{10}" placeholder="Enter 10-digit number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Select Model</label>
            <select value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              {['Tata Curvv EV', 'Mahindra Thar Roxx', 'Maruti Suzuki eVX', 'Hyundai Creta EV'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Preferred Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Book Free Test Drive</button>
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

const BrochureModal = ({ onClose, onToast, isPage }: { onClose?: () => void; onToast: (msg: string, type: 'success' | 'error' | 'info') => void; isPage?: boolean }) => {
  const [model, setModel] = useState('Tata Curvv EV');

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    onToast(`Brochure for ${model} successfully downloaded!`, 'success');
    if (onClose) onClose();
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Download Brochure</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Download Brochure</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Get official specifications and accessory details for upcoming models.</p>
      </div>

      <form onSubmit={handleDownload} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Select Car Model</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
            {['Tata Curvv EV', 'Mahindra Thar Roxx', 'Maruti Suzuki eVX', 'Hyundai Creta EV'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>📥 Download Official PDF</button>
      </form>
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

const OffersModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>New Car Offers</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>New Car Offers</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Exclusive discounts, cashback, and exchange bonuses on new car purchases.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { title: 'Festival Cash Benefit', value: 'Flat ₹30,000 Off', desc: 'Direct showroom discount applicable on bookings before the end of this month.' },
          { title: 'Exchange Bonus Policy', value: 'Up to ₹50,000 Extra', desc: 'Exchange your old verified car at CarSaathi and get a top-up discount on your brand new purchase.' },
          { title: 'Zero Cost Accessory Pack', value: 'Worth ₹15,000 Free', desc: 'Complementary alloy details or dashboard styling accessories on select SUV variants.' }
        ].map((item, idx) => (
          <div key={idx} style={{ borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 2 ? '12px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-dark)' }}>{item.title}</h4>
              <span style={{ fontSize: '0.78rem', color: '#ff5a00', fontWeight: 'bold' }}>{item.value}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>{item.desc}</p>
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

const EligibilityModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [income, setIncome] = useState(50000);
  const [emi, setEmi] = useState(0);
  const [employment, setEmployment] = useState('Salaried');
  const [eligibility, setEligibility] = useState<number | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const maxEmi = (income * 0.5) - emi;
    if (maxEmi <= 0) {
      setEligibility(0);
      return;
    }
    const maxLoan = Math.round((maxEmi / 2100) * 100000);
    setEligibility(Math.max(0, maxLoan));
  };

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Loan Eligibility Checker</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Loan Eligibility Checker</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Estimate your maximum loan limit based on your financial details.</p>
      </div>

      {eligibility !== null ? (
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-gray)' }}>Maximum Loan Limit</span>
          {eligibility > 0 ? (
            <>
              <h2 style={{ color: '#10b981', fontSize: '2.5rem', margin: 0, fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ₹{eligibility.toLocaleString('en-IN')}
              </h2>
              <div style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '20px', display: 'inline-block', margin: '0 auto', fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
                Credit Status: APPROVED
              </div>

              <div style={{ marginTop: '16px', background: 'var(--bg-body)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: 'var(--text-dark)', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>Credit Assessment Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
                  <span>EMI Burden Ratio:</span>
                  <strong style={{ color: (emi / income) > 0.35 ? '#ff5a00' : '#10b981' }}>{Math.round((emi / income) * 100)}% of income</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
                  <span>Max Monthly EMI Allowable:</span>
                  <strong style={{ color: 'var(--text-dark)' }}>₹{Math.round(income * 0.5 - emi).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
                  <span>Recommended Partner Bank:</span>
                  <strong style={{ color: 'var(--brand)' }}>SBI Car Loan (8.65% p.a.)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-gray)' }}>
                  <span>Estimated Processing Fee:</span>
                  <strong style={{ color: 'var(--text-dark)' }}>₹2,500 + GST</strong>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ color: '#ef4444', fontSize: '2rem', margin: 0, fontWeight: '800' }}>
                Not Eligible
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>
                Your current monthly EMI obligations (₹{emi.toLocaleString('en-IN')}) exceed 50% of your net monthly income (₹{income.toLocaleString('en-IN')}). Clear existing debts to lower your EMI load and recalculate.
              </p>
            </>
          )}
          <button className="sell-submit-btn" style={{ marginTop: '16px', background: '#ff5a00', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setEligibility(null)}>Check Again</button>
        </div>
      ) : (
        <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Monthly Net Salary (in ₹)</label>
            <input type="number" min="10000" value={income} onChange={e => setIncome(parseInt(e.target.value))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Current Ongoing EMIs (in ₹)</label>
            <input type="number" min="0" value={emi} onChange={e => setEmi(parseInt(e.target.value))} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }} required />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-dark)' }}>Employment Type</label>
            <select value={employment} onChange={e => setEmployment(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}>
              <option value="Salaried">Salaried Employee</option>
              <option value="Self-Employed">Self-Employed Business Owner</option>
              <option value="Professional">Self-Employed Professional (Doctor/CA)</option>
            </select>
          </div>
          <button type="submit" className="sell-submit-btn" style={{ background: '#ff5a00', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Calculate Loan Eligibility</button>
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

const CompareModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Compare Loan Offers</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Compare Loan Offers</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Best interest rates from top banks in India for CarSaathi buyers.</p>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', color: 'var(--text-dark)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Partner Bank</th>
              <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Interest Rate</th>
              <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Processing Fee</th>
              <th style={{ padding: '10px 8px', fontWeight: 'bold' }}>Max Tenure</th>
            </tr>
          </thead>
          <tbody>
            {[
              { bank: 'SBI', rate: '8.65% - 9.15%', fee: '0.5% (Min ₹1,000)', tenure: '7 Years' },
              { bank: 'HDFC Bank', rate: '8.85% - 9.40%', fee: 'Flat ₹2,500', tenure: '7 Years' },
              { bank: 'ICICI Bank', rate: '8.90% - 9.60%', fee: 'Flat ₹3,000', tenure: '7 Years' },
              { bank: 'Axis Bank', rate: '9.10% - 9.75%', fee: '0.25% of loan', tenure: '7 Years' }
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 8px', fontWeight: '500' }}>{row.bank}</td>
                <td style={{ padding: '10px 8px', color: '#ff5a00', fontWeight: 'bold' }}>{row.rate}</td>
                <td style={{ padding: '10px 8px' }}>{row.fee}</td>
                <td style={{ padding: '10px 8px' }}>{row.tenure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: 'var(--text-gray)', lineHeight: '1.4', textAlign: 'left' }}>*Rates and terms are subject to applicant credit rating score and bank terms and conditions.</p>
    </>
  );

  if (isPage) {
    return (
      <div className="sub-option-page-card-wide">
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
          maxWidth: '500px',
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

const DocsModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [docType, setDocType] = useState<'salaried' | 'self-employed'>('salaried');
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);

  const toggleDoc = (doc: string) => {
    setCheckedDocs(prev =>
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const getRequiredDocsList = () => {
    if (docType === 'salaried') {
      return [
        { label: 'Identity Proof', desc: 'PAN Card, Aadhaar Card, or Voter ID' },
        { label: 'Address Proof', desc: 'Aadhaar Card, Utility Bills, or Rent Agreement' },
        { label: 'Salary Slips', desc: 'Recent salary slips for the last 3 months' },
        { label: 'Bank Statements', desc: 'Salary bank statements for the last 6 months' },
        { label: 'Form 16', desc: 'Form 16 filings for the last 2 financial years' }
      ];
    } else {
      return [
        { label: 'Identity Proof', desc: 'PAN Card, Aadhaar Card, or Passport' },
        { label: 'Address Proof', desc: 'Shop & Establishment Certificate or Utility Bills' },
        { label: 'ITR filings', desc: 'Income Tax Return filings for the last 2 years' },
        { label: 'Audited financials', desc: 'Audited Balance Sheet & Profit & Loss Statement' },
        { label: 'Bank Statements', desc: 'Current account bank statements for the last 6 months' }
      ];
    }
  };

  const docs = getRequiredDocsList();
  const progress = Math.round((checkedDocs.filter(d => docs.some(req => req.label === d)).length / docs.length) * 100);

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Required Documents</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Required Documents</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Keep these documents ready for instant digital sanctioning.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '8px' }}>
        <button
          onClick={() => { setDocType('salaried'); setCheckedDocs([]); }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: docType === 'salaried' ? '2px solid var(--orange)' : '1px solid var(--border-light)',
            background: docType === 'salaried' ? 'rgba(255, 90, 0, 0.05)' : 'transparent',
            color: docType === 'salaried' ? '#ff5a00' : 'var(--text-gray)',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          💼 Salaried Employee
        </button>
        <button
          onClick={() => { setDocType('self-employed'); setCheckedDocs([]); }}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: docType === 'self-employed' ? '2px solid var(--orange)' : '1px solid var(--border-light)',
            background: docType === 'self-employed' ? 'rgba(255, 90, 0, 0.05)' : 'transparent',
            color: docType === 'self-employed' ? '#ff5a00' : 'var(--text-gray)',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🏭 Self-Employed Owner
        </button>
      </div>

      {isPage && (
        <div style={{ background: 'var(--bg-body)', padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-gray)', fontWeight: 'bold' }}>Preparation Progress:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '100px', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
            </div>
            <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>{progress}%</strong>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
        {docs.map(row => {
          const isChecked = checkedDocs.includes(row.label);
          return (
            <div
              key={row.label}
              className={`doc-item-check ${isChecked ? 'checked' : ''}`}
              onClick={() => toggleDoc(row.label)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: 'var(--bg-body)', border: isChecked ? '1px solid #10b981' : '1px solid var(--border-light)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: isChecked ? '2px solid #10b981' : '2px solid var(--border-light)',
                background: isChecked ? '#10b981' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 'bold'
              }}>
                {isChecked && '✓'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-dark)' }}>{row.label}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>{row.desc}</span>
              </div>
            </div>
          );
        })}
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

const FaqsModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Car Loan FAQs</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Car Loan FAQs</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Answers to common questions regarding used car financing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { q: 'What is the minimum credit score required?', a: 'A credit rating score of 750 or higher is ideal to qualify for premium interest rates. However, applicants with lower ratings can still secure approvals with slightly modified loan tenures.' },
          { q: 'How is the loan eligibility calculated?', a: 'Eligibility is calculated such that your total liabilities (including the new car EMI) do not exceed 50% of your net monthly salary.' },
          { q: 'Can I get 100% funding on used cars?', a: 'Yes, select banking partners offer 100% on-road funding on certified pre-owned cars, depending on the age of the vehicle and your income profile.' },
          { q: 'Are there any pre-payment or foreclosure charges?', a: 'Public banks like SBI offer zero foreclosure fees, while private banks may charge 2% to 5% if paid within the initial 12 to 24 months of tenure.' }
        ].map((item, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              style={{ padding: '12px', background: 'var(--bg-body)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{item.q}</span>
              <span>{openIdx === idx ? '▲' : '▼'}</span>
            </div>
            {openIdx === idx && (
              <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4', background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
                {item.a}
              </div>
            )}
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
          maxWidth: '460px',
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

const LoanTrackerModal = ({ onClose, user, isPage }: { onClose?: () => void; user: any; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Track Loan Application</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Track Loan Application</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Tracking status for applicant: <strong>{user?.name || 'Guest'}</strong></p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { step: '1', title: 'Application Form Submitted', desc: 'Pre-approval request registered on CarSaathi network.', status: 'completed' },
          { step: '2', title: 'Credit Score Bureau Pull', desc: 'Secured credit rating validation (CIBIL report loaded).', status: 'completed' },
          { step: '3', title: 'Document Verification', desc: 'Verifying income proof, ITR files, and salary account slips.', status: 'in-progress' },
          { step: '4', title: 'Bank Disbursal Approval', desc: 'Final contract signing and balance credit transfer to seller.', status: 'pending' }
        ].map((item, index) => (
          <div key={item.step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {index < 3 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '12px',
                width: '2px',
                height: 'calc(100% + 8px)',
                background: item.status === 'completed' ? '#ff5a00' : 'var(--border-light)'
              }} />
            )}

            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: item.status === 'completed' ? '#ff5a00' : item.status === 'in-progress' ? 'rgba(255, 90, 0, 0.15)' : 'var(--bg-body)',
              border: item.status === 'completed' ? 'none' : item.status === 'in-progress' ? '2px solid #ff5a00' : '2px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.status === 'completed' ? '#fff' : item.status === 'in-progress' ? '#ff5a00' : 'var(--text-gray)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 2
            }}>
              {item.status === 'completed' ? '✓' : item.step}
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: '700', color: item.status === 'pending' ? 'var(--text-gray)' : 'var(--text-dark)' }}>
                {item.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>
                {item.desc}
              </p>
            </div>
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
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
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

const TrackerModal = ({ onClose, user, isPage }: { onClose?: () => void; user: any; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Track Listing Status</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Track Listing Status</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Tracking listing applications for user: <strong>{user?.name || 'Guest'}</strong></p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { step: '1', title: 'Listing Application Received', desc: 'Car details and documentation submitted successfully.', status: 'completed' },
          { step: '2', title: 'Home Technical Inspection', desc: 'Home physical evaluation scheduled and pending verification.', status: 'in-progress' },
          { step: '3', title: 'Inspection Report Generation', desc: 'Compiling 140-point checklist & grading verification certificate.', status: 'pending' },
          { step: '4', title: 'Published Live to Buyer Grid', desc: 'Elasticsearch integration live.', status: 'pending' }
        ].map((item, index) => (
          <div key={item.step} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            {index < 3 && (
              <div style={{
                position: 'absolute',
                top: '24px',
                left: '12px',
                width: '2px',
                height: 'calc(100% + 8px)',
                background: item.status === 'completed' ? '#ff5a00' : 'var(--border-light)'
              }} />
            )}

            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: item.status === 'completed' ? '#ff5a00' : item.status === 'in-progress' ? 'rgba(255, 90, 0, 0.15)' : 'var(--bg-body)',
              border: item.status === 'completed' ? 'none' : item.status === 'in-progress' ? '2px solid #ff5a00' : '2px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.status === 'completed' ? '#fff' : item.status === 'in-progress' ? '#ff5a00' : 'var(--text-gray)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 2
            }}>
              {item.status === 'completed' ? '✓' : item.step}
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: '700', color: item.status === 'pending' ? 'var(--text-gray)' : 'var(--text-dark)' }}>
                {item.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>
                {item.desc}
              </p>
            </div>
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
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
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

const TipsModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Used Car Selling Tips</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Used Car Selling Tips</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>How to get the highest price and fast closures for your car.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { icon: '🧼', title: 'Clean & Detail the Vehicle', desc: 'Wash the exterior and vacuum the interior. A clean car increases perceived value by up to 10%.' },
          { icon: '📸', title: 'Take Quality Photos in Day Light', desc: 'Shoot at least 6 high-res photos: Front-three-quarter, side profile, rear, dashboard, rear legroom, and tire condition.' },
          { icon: '📋', title: 'Prepare Service History', desc: 'Buyers pay a premium for cars with complete, verifiable maintenance files and insurance documents.' },
          { icon: '🏷️', title: 'Price it Competitively', desc: 'Check similar listings in your city or use our Valuation Tool to price your car within a sweet spot.' }
        ].map(tip => (
          <div key={tip.title} style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '1.8rem', lineHeight: '1' }}>{tip.icon}</span>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-dark)' }}>{tip.title}</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>{tip.desc}</p>
            </div>
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

const SellSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">Why Sell with CarSaathi?</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">⚡</span>
        <div>
          <h4 className="sidebar-feature-title">Instant Value Quotation</h4>
          <p className="sidebar-feature-desc">Our proprietary machine learning algorithm evaluates 200+ price checkpoints to give accurate market valuations in 10 seconds.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🛡️</span>
        <div>
          <h4 className="sidebar-feature-title">Free RC Transfer & Paperwork</h4>
          <p className="sidebar-feature-desc">Complete legal ownership transfer and documentation handled entirely by CarSaathi legal team at zero cost.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🤝</span>
        <div>
          <h4 className="sidebar-feature-title">1-Visit Payment Sanction</h4>
          <p className="sidebar-feature-desc">Once inspection is done at your doorstep, transaction amount is credited directly to your bank account via IMPS/NEFT instantly.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card">
      <div className="sidebar-stat-number">4.8 ★</div>
      <p className="sidebar-stat-label">Rated by over 1,50,000+ happy car sellers in India</p>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "Got ₹45,000 higher than local dealerships. The doorstep inspection team was super professional, and the payment was credited to my account before they even left my house!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Rohan Mehra, Mumbai</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>👩‍💼</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Sell Advisor</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Riya: <strong>+91 98765 43210</strong></span>
      </div>
    </div>
  </div>
);

const LoanSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">CarSaathi Finance Edge</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">📈</span>
        <div>
          <h4 className="sidebar-feature-title">Lowest Interest Rates</h4>
          <p className="sidebar-feature-desc">Get special corporate rates starting at 8.45% p.a. through integrations with HDFC, ICICI, SBI, and Axis Bank.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">⏱️</span>
        <div>
          <h4 className="sidebar-feature-title">Instant E-Approval</h4>
          <p className="sidebar-feature-desc">Skip long bank queues. Get digital loan approval letter generated in under 15 minutes by verified details.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">💰</span>
        <div>
          <h4 className="sidebar-feature-title">Zero Foreclosure Fees</h4>
          <p className="sidebar-feature-desc">Select bank offers provide flexible repayment terms with zero penalties for prepayments after 12 months.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <div style={{ flex: 1, borderRight: '1px solid var(--border-light)' }}>
        <div className="sidebar-stat-number" style={{ fontSize: '1.4rem' }}>₹0</div>
        <p className="sidebar-stat-label">Processing Fee Option</p>
      </div>
      <div style={{ flex: 1 }}>
        <div className="sidebar-stat-number" style={{ fontSize: '1.4rem', color: '#10b981' }}>100%</div>
        <p className="sidebar-stat-label">On-Road Funding</p>
      </div>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "Calculated my eligibility and applied online. CarSaathi team coordinated everything with SBI, and the loan amount was sanctioned in 24 hours with zero physical paperwork!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Priya Sharma, Delhi</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>🤵</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Finance Advisor</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Vikram: <strong>+91 98765 43211</strong></span>
      </div>
    </div>
  </div>
);

const NewSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">Buy New Cars Smartly</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🚗</span>
        <div>
          <h4 className="sidebar-feature-title">Dealership Price Guarantee</h4>
          <p className="sidebar-feature-desc">We fetch live quotes from all authorized brand dealerships in your city to present the lowest on-road price.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🎁</span>
        <div>
          <h4 className="sidebar-feature-title">Exclusive Online Benefits</h4>
          <p className="sidebar-feature-desc">Book through CarSaathi to gain corporate discounts, accessory packages, and priority delivery timelines.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">⚡</span>
        <div>
          <h4 className="sidebar-feature-title">EV Transition Support</h4>
          <p className="sidebar-feature-desc">Get assistance with home charger setups, state subsidy applications, and green tax benefits calculation.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card">
      <div className="sidebar-stat-number" style={{ color: '#3b82f6' }}>15 Days</div>
      <p className="sidebar-stat-label">Average delivery time limit for premium new models</p>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "Booked a test drive for the new Nexon EV online. Dealership executive brought the car right to my office gate the next afternoon. Extremely prompt and convenient service!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Amit Verma, Bangalore</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>🧑‍💻</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Car Advisor</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Kabir: <strong>+91 98765 43212</strong></span>
      </div>
    </div>
  </div>
);

const ServicesSidebarInfo = () => (
  <div className="sub-option-info-sidebar">
    <h3 className="sidebar-heading">CarSaathi Care Promise</h3>
    <div className="sidebar-feature-list">
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🔩</span>
        <div>
          <h4 className="sidebar-feature-title">100% Genuine OEM Spares</h4>
          <p className="sidebar-feature-desc">All replacement parts are sourced directly from official manufacturer components with verifiable warranty logs.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">🚚</span>
        <div>
          <h4 className="sidebar-feature-title">Free Doorstep Pick & Drop</h4>
          <p className="sidebar-feature-desc">Certified service drivers pick up your vehicle from your home/office and drop it back fully serviced and washed.</p>
        </div>
      </div>
      <div className="sidebar-feature-item">
        <span className="sidebar-feature-icon">📋</span>
        <div>
          <h4 className="sidebar-feature-title">Warranty Intact Servicing</h4>
          <p className="sidebar-feature-desc">Periodic checks conform strictly to dealer standards so that your original vehicle manufacturer warranty remains valid.</p>
        </div>
      </div>
    </div>
    <div className="sidebar-stat-card">
      <div className="sidebar-stat-number" style={{ color: '#10b981' }}>10,000 km</div>
      <p className="sidebar-stat-label">Or 6 Months network service warranty on all jobs</p>
    </div>

    {/* Customer Review Testimonial */}
    <div style={{ background: 'var(--bg-body)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-gray)', fontStyle: 'italic', position: 'relative', textAlign: 'left', marginTop: '10px' }}>
      "My car broke down late last Friday night. Requested Roadside Assistance via the app and towing truck crew arrived within 22 minutes to tow it to the nearest center. LIFE SAVER!"
      <span style={{ display: 'block', fontStyle: 'normal', fontWeight: 'bold', color: 'var(--text-dark)', marginTop: '6px', fontSize: '0.74rem' }}>— Sneha Patil, Pune</span>
    </div>

    {/* Dedicated Advisor Contact Info */}
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ff5a00', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem' }}>🔧</div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Dedicated Service Manager</span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-gray)' }}>Talk to Rahul: <strong>+91 98765 43213</strong></span>
      </div>
    </div>
  </div>
);

export default function App() {
  // 2. States
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          const userTheme = localStorage.getItem(`theme_user_${parsed.id}`);
          if (userTheme === 'dark' || userTheme === 'light') {
            return userTheme;
          }
        }
      } catch (e) {}
    }
    return 'light'; // Default to light mode for anonymous users and initial loads
  });

  // Lightbox / Image Zoom States
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Esc key to close Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLightbox(false);
      }
    };
    if (showLightbox) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLightbox]);

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.5, 4));
  };
  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };
  const handleZoomReset = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(prev + 0.25, 4));
    } else {
      setZoomScale(prev => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) {
          setPanPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleZoomReset();
    } else {
      setZoomScale(2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - panPosition.x,
      y: e.touches[0].clientY - panPosition.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    setPanPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && zoomScale === 1) {
      setShowLightbox(false);
    }
  };

  const [cars, setCars] = useState<any[]>([]);
  const [allCars, setAllCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminLeads, setAdminLeads] = useState<{
    bookings: any[];
    services: any[];
    loans: any[];
    newCarLeads: any[];
  } | null>(null);
  const [isAdminLeadsLoading, setIsAdminLeadsLoading] = useState<boolean>(false);
  const [adminLeadsError, setAdminLeadsError] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'services' | 'loans' | 'newCarLeads'>('bookings');
  const [maxPriceFilter, setMaxPriceFilter] = useState(50000000);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [isSemanticSearch] = useState<boolean>(true);
  const [isSearchingMobile, setIsSearchingMobile] = useState(false);
  const [priceQuery, setPriceQuery] = useState('');
  const [parsedPrice, setParsedPrice] = useState<{ value?: number; min?: number; max?: number } | null>(null);
  const [priceFormat, setPriceFormat] = useState<'lakh' | 'full'>('lakh');

  // Debounce search input typing to prevent input lag
  useEffect(() => {
    const handler = setTimeout(() => {
      const { cleanQuery, parsedPrice: extractedPrice } = parseAndExtractBudget(localSearchTerm);
      setSearchTerm(cleanQuery);
      
      if (extractedPrice) {
        setParsedPrice(extractedPrice);
      } else {
        // Only reset parsedPrice if priceQuery is not active
        if (!priceQuery.trim()) {
          setParsedPrice(null);
        }
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [localSearchTerm, priceQuery]);

  // Auto-redirect and scroll when mobile search is active
  useEffect(() => {
    if (isSearchingMobile) {
      setCurrentView('preowned');
      setSelectedCarId(null);
      setShowWishlistOnly(false);
      setShowMyListingsOnly(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSearchingMobile]);

  const [apiError, setApiError] = useState<string | null>(null);
  const [region, setRegion] = useState<'IN' | 'UK'>('IN');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'make_asc'>('year_desc');
  const [tabSelected, setTabSelected] = useState<'all' | 'luxe'>('all');
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(false);

  // Sell dropdown states
  const [showMyListingsOnly, setShowMyListingsOnly] = useState(false);

  // Advanced Filters
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedKms, setSelectedKms] = useState<string>('all');
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Geolocation & toast notification states
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Mobile menu toggle state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile filters overlay toggle state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Details Page & Booking States
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<any | null>(null);

  // Auto-close mobile search overlay when viewing a specific car details page
  useEffect(() => {
    if (selectedCarId !== null) {
      setIsSearchingMobile(false);
    }
  }, [selectedCarId]);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // 5-Tab Navigation States
  const [currentView, setCurrentView] = useState<
    'preowned' | 'sell' | 'loan-apply' | 'loan-calculator' | 'new-cars' | 'services' | 'ai-recommend' | 'admin-leads' |
    'sell-valuation' | 'sell-inspection' | 'sell-my-listings' | 'sell-tracker' | 'sell-tips' |
    'loan-eligibility' | 'loan-compare' | 'loan-docs' | 'loan-faqs' | 'loan-track' |
    'new-launches' | 'new-compare' | 'new-test-drive' | 'new-brochure' | 'new-offers' |
    'services-insurance' | 'services-inspection' | 'services-rsa' | 'services-history' | 'services-centers' | 'services-wash'
  >('preowned');

  // Auto-close mobile menu when key view state changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentView, selectedCarId, showWishlistOnly, selectedCity]);

  // AI Recommendation States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBudget, setAiBudget] = useState<number>(1500000);
  const [aiPurpose, setAiPurpose] = useState('commuting');
  const [aiFuelType, setAiFuelType] = useState('Any');
  const [aiBodyType, setAiBodyType] = useState('Any');
  const [aiPriority, setAiPriority] = useState('comfort');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiVerdict, setAiVerdict] = useState('');

  const [aiError, setAiError] = useState<string | null>(null);

  // Sell Car Form State
  const [sellForm, setSellForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    city: '',
    imageUrl: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    kms_driven: '',
    owners: '1st Owner',
    rto: ''
  });
  const [sellSuccess, setSellSuccess] = useState<boolean>(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [isSellLoading, setIsSellLoading] = useState<boolean>(false);

  // Car Loan Calculator & Application States
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [loanInterest, setLoanInterest] = useState<number>(9.5);
  const [loanTenure, setLoanTenure] = useState<number>(5);
  const [loanForm, setLoanForm] = useState({
    name: '',
    phone: '',
    income: '',
    employment: 'Salaried',
    creditScore: '750+ (Excellent)'
  });
  const [loanSuccess, setLoanSuccess] = useState<any | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [isLoanLoading, setIsLoanLoading] = useState<boolean>(false);
  const [loanDocs, setLoanDocs] = useState<{
    identityProof: { name: string; data: string } | null;
    addressProof: { name: string; data: string } | null;
    incomeProof: { name: string; data: string } | null;
  }>({
    identityProof: null,
    addressProof: null,
    incomeProof: null,
  });

  // New Cars Leads States
  const [selectedNewCar, setSelectedNewCar] = useState<string | null>(null);
  const [newCarForm, setNewCarForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: ''
  });
  const [newCarSuccess, setNewCarSuccess] = useState<boolean>(false);
  const [newCarError, setNewCarError] = useState<string | null>(null);
  const [isNewCarLoading, setIsNewCarLoading] = useState<boolean>(false);

  // Car Services Booking States
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    phone: '',
    city: 'Delhi',
    date: ''
  });
  const [serviceSuccess, setServiceSuccess] = useState<any | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isServiceLoading, setIsServiceLoading] = useState<boolean>(false);

  // Authentication states
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [authMode] = useState<'login' | 'register'>('login');
  // Note: authForm and OTP verification states are fully encapsulated inside <AuthModal /> to avoid input typing lag.
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showManualCities, setShowManualCities] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
    if (user && user.id) {
      localStorage.setItem(`theme_user_${user.id}`, theme);
    }
  }, [theme, user]);

  // Fetch all cars once on load to populate filter options (counts/cities)
  useEffect(() => {
    const baseApiUrl = API_URL;
    fetch(`${baseApiUrl}/cars`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch cars');
        }
        return res.json();
      })
      .then((data) => {
        setAllCars(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Fetch cars from the backend when search or filters change
  useEffect(() => {
    const baseApiUrl = API_URL;

    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm);
    if (selectedCity !== 'all') params.append('city', selectedCity);

    // Price range
    let minPrice = 0;
    let maxPrice = maxPriceFilter;
    if (parsedPrice) {
      if ('value' in parsedPrice && parsedPrice.value !== undefined) {
        maxPrice = parsedPrice.value;
      } else if ('min' in parsedPrice && 'max' in parsedPrice && parsedPrice.min !== undefined && parsedPrice.max !== undefined) {
        minPrice = parsedPrice.min;
        maxPrice = parsedPrice.max;
      }
    }
    params.append('minPrice', minPrice.toString());
    params.append('maxPrice', maxPrice.toString());

    if (selectedMakes.length > 0) {
      params.append('makes', selectedMakes.join(','));
    }

    if (tabSelected === 'luxe') {
      params.append('luxe', 'true');
    }

    const endpoint = isSemanticSearch && searchTerm.trim()
      ? `${baseApiUrl}/cars/search/semantic?q=${encodeURIComponent(searchTerm)}&${params.toString()}`
      : `${baseApiUrl}/cars?${params.toString()}`;

    const handler = setTimeout(() => {
      fetch(endpoint)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch cars');
          }
          return res.json();
        })
        .then((data) => {
          setCars(data);
          setIsLoading(false);
          setApiError(null);
        })
        .catch((err) => {
          console.error(err);
          setApiError('Could not load car listings from server');
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCity, maxPriceFilter, parsedPrice, tabSelected, selectedMakes, sortBy, isSemanticSearch]);

  // Automatically select relevance sort when search is typed, and reset when cleared
  useEffect(() => {
    if (searchTerm.trim()) {
      setSortBy('relevance');
    } else {
      setSortBy('year_desc');
    }
  }, [searchTerm]);

  // Fetch admin leads when in admin-leads view
  useEffect(() => {
    if (currentView === 'admin-leads' && token) {
      setIsAdminLeadsLoading(true);
      setAdminLeadsError(null);
      const baseApiUrl = API_URL;
      fetch(`${baseApiUrl}/admin/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to fetch admin leads');
          }
          return res.json();
        })
        .then((data) => {
          setAdminLeads(data);
          setIsAdminLeadsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setAdminLeadsError(err.message || 'Could not load leads dashboard.');
          setIsAdminLeadsLoading(false);
        });
    }
  }, [currentView, token]);

  // Prepopulate booking form if user is logged in
  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone
      }));
    }
  }, [user]);

  // Fetch details of a selected car
  useEffect(() => {
    if (selectedCarId === null) {
      setSelectedCar(null);
      setBookingSuccess(null);
      setBookingError(null);
      return;
    }

    // Scroll to top of window when a car is selected
    window.scrollTo({ top: 0, behavior: 'instant' });

    const baseApiUrl = API_URL;
    fetch(`${baseApiUrl}/cars/${selectedCarId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch car details');
        }
        return res.json();
      })
      .then((data) => {
        setSelectedCar(data);
      })
      .catch((err) => {
        console.error(err);
        setApiError('Could not load car details from server');
      });
  }, [selectedCarId]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) return;

    setBookingError(null);
    setBookingSuccess(null);
    setIsBookingLoading(true);

    const baseApiUrl = API_URL;

    if (!bookingForm.name.trim()) {
      setBookingError("Name is required.");
      setIsBookingLoading(false);
      return;
    }
    if (!bookingForm.phone.trim() || bookingForm.phone.trim().length < 8) {
      setBookingError("A valid phone number is required (min 8 digits).");
      setIsBookingLoading(false);
      return;
    }
    if (!bookingForm.date) {
      setBookingError("Please select a date for the test drive.");
      setIsBookingLoading(false);
      return;
    }
    if (!bookingForm.time) {
      setBookingError("Please select a preferred time slot.");
      setIsBookingLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseApiUrl}/cars/${selectedCarId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookingForm.name,
          phone: bookingForm.phone,
          date: bookingForm.date,
          time: bookingForm.time
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book test drive");
      }

      setBookingSuccess(data.booking);
      // clear slot date/time after success
      setBookingForm(prev => ({
        ...prev,
        date: '',
        time: ''
      }));
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit booking. Please try again.");
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Synchronize user profile with all interactive forms
  useEffect(() => {
    if (user) {
      setLoanForm(prev => ({ ...prev, name: user.name, phone: user.phone }));
      setNewCarForm(prev => ({ ...prev, name: user.name, phone: user.phone, email: user.email }));
      setServiceForm(prev => ({ ...prev, name: user.name, phone: user.phone }));
      setSellForm(prev => ({ ...prev, city: user.city || '' }));
    }
  }, [user]);

  // Handler for listing a car for sale
  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellError(null);
    setSellSuccess(false);
    setIsSellLoading(true);

    const baseApiUrl = API_URL;

    if (!sellForm.make.trim()) {
      setSellError("Make (Brand) is required.");
      setIsSellLoading(false);
      return;
    }
    if (!sellForm.model.trim()) {
      setSellError("Model is required.");
      setIsSellLoading(false);
      return;
    }
    const yearVal = parseInt(sellForm.year as any, 10);
    if (isNaN(yearVal) || yearVal < 1900 || yearVal > 2027) {
      setSellError("Please enter a valid year between 1900 and 2027.");
      setIsSellLoading(false);
      return;
    }
    const priceVal = parseInt(sellForm.price, 10);
    if (isNaN(priceVal) || priceVal <= 0) {
      setSellError("Please enter a valid price.");
      setIsSellLoading(false);
      return;
    }
    if (!sellForm.city.trim()) {
      setSellError("Location (City) is required.");
      setIsSellLoading(false);
      return;
    }
    const kmsVal = parseInt(sellForm.kms_driven, 10);
    if (isNaN(kmsVal) || kmsVal < 0) {
      setSellError("Please enter valid kilometers driven.");
      setIsSellLoading(false);
      return;
    }
    if (!sellForm.rto.trim()) {
      setSellError("Registration RTO is required.");
      setIsSellLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseApiUrl}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sellForm)
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status: ${res.status}).`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to list car");
      }

      setSellSuccess(true);
      setSellForm({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        city: user ? user.city || '' : '',
        imageUrl: '',
        fuel_type: 'Petrol',
        transmission: 'Manual',
        kms_driven: '',
        owners: '1st Owner',
        rto: ''
      });

      // Refresh both cars and allCars so the new car shows up immediately in FTS searches
      fetch(`${baseApiUrl}/cars`)
        .then(res => res.json())
        .then(data => {
          setAllCars(data);
          setCars(data);
        });
    } catch (err: any) {
      setSellError(err.message || "Failed to list car. Please check connection.");
    } finally {
      setIsSellLoading(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("Are you sure you want to delete this car listing?")) {
      return;
    }

    const baseApiUrl = API_URL;
    try {
      const res = await fetch(`${baseApiUrl}/cars/${carId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete car listing');
      }

      alert("Car listing deleted successfully!");
      setCars(prev => prev.filter(c => c.id !== carId));
      setAllCars(prev => prev.filter(c => c.id !== carId));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete car listing.");
    }
  };

  // Edit Car states & handlers for Dealers and Admins
  const [editingCar, setEditingCar] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    city: '',
    imageUrl: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    kms_driven: '',
    owners: '1st Owner',
    rto: ''
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  const openEditModal = (car: any) => {
    setEditingCar(car);
    setEditForm({
      make: car.make || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      price: car.price ? String(car.price) : '',
      city: car.city || '',
      imageUrl: car.image_url || car.imageUrl || '',
      fuel_type: car.fuel_type || 'Petrol',
      transmission: car.transmission || 'Manual',
      kms_driven: car.kms_driven !== undefined && car.kms_driven !== null ? String(car.kms_driven) : '',
      owners: car.owners || '1st Owner',
      rto: car.rto || ''
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleEditCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCar || !token) return;
    setEditError(null);
    setIsEditLoading(true);

    try {
      const baseApiUrl = API_URL;
      const res = await fetch(`${baseApiUrl}/cars/${editingCar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update car listing');
      }

      const updatedCar = data.car;

      setCars(prev => prev.map(c => c.id === updatedCar.id ? { ...c, ...updatedCar } : c));
      setAllCars(prev => prev.map(c => c.id === updatedCar.id ? { ...c, ...updatedCar } : c));
      if (selectedCar && selectedCar.id === updatedCar.id) {
        setSelectedCar((prev: any) => ({ ...prev, ...updatedCar }));
      }

      alert("Car listing updated successfully!");
      setIsEditModalOpen(false);
      setEditingCar(null);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || "Failed to update car listing.");
    } finally {
      setIsEditLoading(false);
    }
  };

  // Handler for Loan application submission
  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError(null);
    setLoanSuccess(null);
    setIsLoanLoading(true);

    const baseApiUrl = API_URL;

    if (!loanForm.name.trim()) {
      setLoanError("Name is required.");
      setIsLoanLoading(false);
      return;
    }
    if (!loanForm.phone.trim() || loanForm.phone.trim().length < 8) {
      setLoanError("A valid phone number is required.");
      setIsLoanLoading(false);
      return;
    }
    const incomeVal = parseInt(loanForm.income, 10);
    if (isNaN(incomeVal) || incomeVal <= 0) {
      setLoanError("Please enter a valid monthly income.");
      setIsLoanLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseApiUrl}/loan-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...loanForm,
          loanAmount,
          tenure: loanTenure,
          identityProofName: loanDocs.identityProof?.name || null,
          identityProofData: loanDocs.identityProof?.data || null,
          addressProofName: loanDocs.addressProof?.name || null,
          addressProofData: loanDocs.addressProof?.data || null,
          incomeProofName: loanDocs.incomeProof?.name || null,
          incomeProofData: loanDocs.incomeProof?.data || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit loan application");
      }

      setLoanSuccess(data.application);
    } catch (err: any) {
      setLoanError(err.message || "Failed to submit loan application. Please try again.");
    } finally {
      setIsLoanLoading(false);
    }
  };

  // Handler for New Car Leads registration
  const handleNewCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCarError(null);
    setNewCarSuccess(false);
    setIsNewCarLoading(true);

    const baseApiUrl = API_URL;

    if (!selectedNewCar) {
      setNewCarError("Please select a car first.");
      setIsNewCarLoading(false);
      return;
    }
    if (!newCarForm.name.trim()) {
      setNewCarError("Name is required.");
      setIsNewCarLoading(false);
      return;
    }
    if (!newCarForm.phone.trim() || newCarForm.phone.trim().length < 8) {
      setNewCarError("A valid phone number is required.");
      setIsNewCarLoading(false);
      return;
    }
    if (!newCarForm.email.trim() || !newCarForm.email.includes('@')) {
      setNewCarError("A valid email address is required.");
      setIsNewCarLoading(false);
      return;
    }
    if (!newCarForm.city.trim()) {
      setNewCarError("Location is required.");
      setIsNewCarLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseApiUrl}/new-car-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carName: selectedNewCar,
          ...newCarForm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register interest");
      }

      setNewCarSuccess(true);
      setNewCarForm(prev => ({
        ...prev,
        city: ''
      }));
    } catch (err: any) {
      setNewCarError(err.message || "Failed to register interest. Please try again.");
    } finally {
      setIsNewCarLoading(false);
    }
  };

  // Handler for Service Booking
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError(null);
    setServiceSuccess(null);
    setIsServiceLoading(true);

    const baseApiUrl = API_URL;

    if (!selectedService) {
      setServiceError("Please select a service first.");
      setIsServiceLoading(false);
      return;
    }
    if (!serviceForm.name.trim()) {
      setServiceError("Name is required.");
      setIsServiceLoading(false);
      return;
    }
    if (!serviceForm.phone.trim() || serviceForm.phone.trim().length < 8) {
      setServiceError("A valid phone number is required.");
      setIsServiceLoading(false);
      return;
    }
    if (!serviceForm.city.trim()) {
      setServiceError("City is required.");
      setIsServiceLoading(false);
      return;
    }
    if (!serviceForm.date) {
      setServiceError("Please select a service date.");
      setIsServiceLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseApiUrl}/service-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: selectedService,
          ...serviceForm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book service");
      }

      setServiceSuccess(data.booking);
      setServiceForm(prev => ({
        ...prev,
        date: ''
      }));
    } catch (err: any) {
      setServiceError(err.message || "Failed to submit service booking. Please try again.");
    } finally {
      setIsServiceLoading(false);
    }
  };

  // 3. Debounced API fetch to connect with the backend parser API
  useEffect(() => {
    if (!priceQuery.trim()) {
      setParsedPrice(null);
      setApiError(null);
      return;
    }

    const handler = setTimeout(() => {
      const baseApiUrl = API_URL;
      fetch(`${baseApiUrl}/parse?q=${encodeURIComponent(priceQuery)}`)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error("Couldn't understand that price");
          }
          return res.json();
        })
        .then((data) => {
          setParsedPrice(data);
          setApiError(null);
        })
        .catch(() => {
          setParsedPrice(null);
          setApiError("Couldn't understand that price");
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [priceQuery]);

  // 4. Brand selection toggler
  const handleMakeToggle = (make: string) => {
    if (selectedMakes.includes(make)) {
      setSelectedMakes(selectedMakes.filter(m => m !== make));
    } else {
      setSelectedMakes([...selectedMakes, make]);
    }
  };

  // 5. Wishlist toggle
  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(wId => wId !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  // Extract unique cities dynamically from all cars database
  const uniqueCities = Array.from(new Set(allCars.map((car: any) => car.city))).sort();

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    triggerToast('Detecting your location...', 'info');

    // Helper for IP-based geolocation fallback using multiple providers in sequence
    const detectLocationByIP = async (): Promise<boolean> => {
      // Client-side sequential IP providers (runs directly in user's browser for maximum accuracy)
      const providers = [
        async () => {
          // Provider 1: ipwho.is (highly reliable HTTPS, no rate limit/CORS blocks)
          const res = await fetch('https://ipwho.is/');
          if (!res.ok) throw new Error('ipwhois failed');
          const data = await res.json();
          if (data && data.success && data.latitude !== undefined && data.longitude !== undefined) {
            return { lat: Number(data.latitude), lng: Number(data.longitude) };
          }
          throw new Error('ipwhois invalid format');
        },
        async () => {
          // Provider 2: freeipapi.com (rarely blocked, supports HTTPS)
          const res = await fetch('https://freeipapi.com/api/json');
          if (!res.ok) throw new Error('freeipapi failed');
          const data = await res.json();
          if (data && data.latitude !== undefined && data.longitude !== undefined) {
            return { lat: Number(data.latitude), lng: Number(data.longitude) };
          }
          throw new Error('freeipapi invalid format');
        },
        async () => {
          // Provider 3: ipinfo.io (standard fallback with coordinate parsing - rarely blocked by Cloudflare)
          const res = await fetch('https://ipinfo.io/json');
          if (!res.ok) throw new Error('ipinfo failed');
          const data = await res.json();
          if (data && data.loc) {
            const [lat, lng] = data.loc.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }
          throw new Error('ipinfo invalid format');
        },
        async () => {
          // Provider 4: ipapi.co (standard fallback - put near end because of occasional Cloudflare challenge walls)
          const res = await fetch('https://ipapi.co/json/');
          if (!res.ok) throw new Error('ipapi.co failed');
          const data = await res.json();
          if (data && data.latitude !== undefined && data.longitude !== undefined) {
            return { lat: Number(data.latitude), lng: Number(data.longitude) };
          }
          throw new Error('ipapi.co invalid format');
        },
        async () => {
          // Provider 5: Server-side IP geolocation fallback (extracts X-Forwarded-For client IP on backend)
          console.log("Trying server-side IP geolocation fallback...");
          const res = await fetch(`${API_URL}/cars/locate`);
          if (!res.ok) throw new Error('Server-side locate failed');
          const coords = await res.json();
          if (coords && coords.lat !== undefined && coords.lng !== undefined) {
            return { lat: Number(coords.lat), lng: Number(coords.lng) };
          }
          throw new Error('Server-side locate invalid format');
        }
      ];

      for (const getCoords of providers) {
        try {
          console.log("Trying IP geolocation provider...");
          const coords = await getCoords();
          if (coords && coords.lat !== undefined && coords.lng !== undefined) {
            let closestCity = 'all';
            let minDistance = Infinity;

            uniqueCities.forEach((city) => {
              const cityCoords = CITY_COORDINATES[city];
              if (cityCoords) {
                const dist = getDistance(coords.lat, coords.lng, cityCoords.lat, cityCoords.lng);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestCity = city;
                }
              }
            });

            if (closestCity !== 'all') {
              setSelectedCity(closestCity);
              triggerToast(closestCity, 'success');
              return true;
            }
          }
        } catch (err) {
          console.warn("IP Geolocation provider failed, trying next...", err);
        }
      }
      return false;
    };

    // Fast-path check: If permission is already denied, skip HTML5 geolocation timeout entirely
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permissionStatus.state === 'denied') {
          console.log("Geolocation permission is denied. Using IP fallback immediately...");
          const success = await detectLocationByIP();
          setIsDetectingLocation(false);
          if (!success) {
            triggerToast('Location permission denied. Please select manually.', 'error');
          }
          return;
        }
      } catch (err) {
        console.warn("Error querying geolocation permission state:", err);
      }
    }

    // If Geolocation API is not supported/blocked (non-secure context)
    if (!navigator.geolocation) {
      console.log("Browser geolocation not supported/blocked. Trying IP fallback...");
      const success = await detectLocationByIP();
      setIsDetectingLocation(false);
      if (!success) {
        triggerToast('Could not detect location automatically. Please select manually.', 'error');
      }
      return;
    }

    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    let position: GeolocationPosition | null = null;
    try {
      console.log("Trying high-accuracy HTML5 geolocation...");
      // Try high-accuracy HTML5 geolocation with a fast timeout (6000ms) and use fresh position
      position = await getPosition({ enableHighAccuracy: true, timeout: 6000, maximumAge: 0 });
    } catch (highAccErr) {
      console.warn("High-accuracy HTML5 geolocation failed, trying low-accuracy fallback...", highAccErr);
      try {
        // Fallback to low-accuracy HTML5 geolocation with a fast timeout (4000ms) and use cached position up to 3 mins old
        position = await getPosition({ enableHighAccuracy: false, timeout: 4000, maximumAge: 180000 });
      } catch (lowAccErr) {
        console.warn("Low-accuracy HTML5 geolocation also failed, falling back to IP geolocation...", lowAccErr);
      }
    }

    if (position) {
      const { latitude, longitude } = position.coords;
      let closestCity = 'all';
      let minDistance = Infinity;

      uniqueCities.forEach((city) => {
        const coords = CITY_COORDINATES[city];
        if (coords) {
          const dist = getDistance(latitude, longitude, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestCity = city;
          }
        }
      });

      setIsDetectingLocation(false);
      if (closestCity !== 'all') {
        setSelectedCity(closestCity);
        triggerToast(closestCity, 'success');
      } else {
        triggerToast('Could not map location to any supported city', 'error');
      }
    } else {
      const success = await detectLocationByIP();
      setIsDetectingLocation(false);
      if (!success) {
        triggerToast('Could not detect location automatically. Please select manually.', 'error');
      }
    }
  };

  // 6. Dynamic filtering (combining backend parameters with simulated client-side attributes)
  const filteredCars = cars.filter((car: any) => {
    // Price filter (fallback verification in frontend)
    let minPrice = 0;
    let maxPrice = maxPriceFilter;
    if (parsedPrice) {
      if ('value' in parsedPrice && parsedPrice.value !== undefined) {
        maxPrice = parsedPrice.value;
      } else if ('min' in parsedPrice && 'max' in parsedPrice && parsedPrice.min !== undefined && parsedPrice.max !== undefined) {
        minPrice = parsedPrice.min;
        maxPrice = parsedPrice.max;
      }
    }
    if (car.price < minPrice || car.price > maxPrice) return false;

    // 1. Wishlist Only filter
    if (showWishlistOnly && !wishlist.includes(car.id)) return false;

    // My Listings filter
    if (showMyListingsOnly && (!user || Number(car.created_by) !== Number(user.id))) return false;

    // 2. Car Age (Year) filter
    const carAge = 2026 - car.year;
    if (selectedAge === 'under3' && carAge >= 3) return false;
    if (selectedAge === 'under5' && carAge >= 5) return false;
    if (selectedAge === 'under8' && carAge >= 8) return false;

    // 3. Fuel Type filter
    const fuelType = getCarFuelType(car);
    if (selectedFuels.length > 0 && !selectedFuels.includes(fuelType)) return false;

    // 4. Kilometers filter
    const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
    const mileage = car.kms_driven !== undefined && car.kms_driven !== null
      ? car.kms_driven
      : Math.round((2026 - car.year) * 11000 + (carHash * 850) % 12000);
    if (selectedKms === 'under30k' && mileage >= 30000) return false;
    if (selectedKms === 'under50k' && mileage >= 50000) return false;
    if (selectedKms === 'under80k' && mileage >= 80000) return false;

    // 5. Transmission filter
    const transmission = getCarTransmission(car);
    if (selectedTransmissions.length > 0 && !selectedTransmissions.includes(transmission)) return false;

    // 6. Color filter
    const color = getCarColor(car);
    if (selectedColors.length > 0 && !selectedColors.includes(color)) return false;

    return true;
  });

  // 7. Sorting (mostly handled by backend, relevance/custom ordering preserved)
  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'year_desc') return b.year - a.year;
    if (sortBy === 'make_asc') return a.make.localeCompare(b.make);
    return 0;
  });

  // Calculate stats
  const avgPrice = filteredCars.length > 0
    ? filteredCars.reduce((sum, car) => sum + car.price, 0) / filteredCars.length
    : 0;

  const handleGetAiRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiLoadingStep(0);
    setAiError(null);

    // Simulated step transitions for the loading card
    const timers = [
      setTimeout(() => setAiLoadingStep(1), 1000),
      setTimeout(() => setAiLoadingStep(2), 2200),
      setTimeout(() => setAiLoadingStep(3), 3500)
    ];

    const baseApiUrl = API_URL;
    try {
      const res = await fetch(`${baseApiUrl}/cars/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          budget: aiBudget,
          purpose: aiPurpose,
          fuelType: aiFuelType,
          bodyType: aiBodyType,
          priority: aiPriority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve AI recommendations.");
      }

      setAiRecommendations(data.recommendations || []);
      setAiVerdict(data.verdict || '');

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Something went wrong while connecting to the AI agent. Please try again.");
    } finally {
      timers.forEach(clearTimeout);
      setAiLoading(false);
    }
  };

  // Note: handleAuthChange, handleAuthSubmit, handleSendOtp, and handleVerifyOtp are fully encapsulated inside <AuthModal />.
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTheme('light');
    setShowUserDropdown(false);
  };

  // Price formatter helper
  const renderFormattedPrice = (price: number) => {
    if (region === 'UK') {
      return formatGBP(price / 100);
    }
    return priceFormat === 'full' ? formatINR(price) : formatCompactINR(price);
  };

  const handleResetToMainListing = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    const isAlreadyOnMainListing = 
      currentView === 'preowned' && 
      selectedCarId === null && 
      !showWishlistOnly && 
      !showMyListingsOnly && 
      tabSelected === 'all' && 
      selectedMakes.length === 0 && 
      selectedFuels.length === 0 && 
      selectedAge === 'all' && 
      !searchTerm && 
      !localSearchTerm && 
      !priceQuery;

    if (isAlreadyOnMainListing) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView('preowned');
    setSelectedCarId(null);
    setShowWishlistOnly(false);
    setShowMyListingsOnly(false);
    setTabSelected('all');
    setSelectedMakes([]);
    setSelectedFuels([]);
    setSelectedAge('all');
    setSearchTerm('');
    setLocalSearchTerm('');
    setPriceQuery('');
    setParsedPrice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {toast && (
        <div className={`custom-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
      {/* Sticky CarSaathi Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="brand-logo" onClick={handleResetToMainListing} style={{ cursor: 'pointer' }} title="Back to main car listings">
            CarSaathi
          </div>
          <div className="location-selector-wrapper" style={{ position: 'relative' }}>
            <button
              className="location-badge-btn"
              onClick={() => {
                setShowLocationDropdown(!showLocationDropdown);
                if (showLocationDropdown) {
                  setShowManualCities(false);
                }
              }}
              type="button"
              aria-label="Select location"
            >
              <span>{selectedCity === 'all' ? 'Location' : selectedCity} ▾</span>
            </button>

            {showLocationDropdown && (
              <>
                <div className="location-dropdown-backdrop" onClick={() => setShowLocationDropdown(false)}></div>
                <div className={`location-custom-dropdown ${showManualCities ? 'manual-select-active' : ''}`}>
                  <div className="location-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    {showManualCities && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualCities(false);
                          setCitySearchQuery('');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          color: 'var(--brand)',
                          padding: '0 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: 'bold',
                          fontFamily: 'inherit'
                        }}
                      >
                        ← Back
                      </button>
                    )}
                    <div className="location-dropdown-title" style={{ margin: 0, fontSize: '1rem', color: 'var(--text-dark)', textTransform: 'none', fontWeight: '800' }}>
                      {showManualCities ? 'Select your City' : 'Please setup location'}
                    </div>
                    <button
                      type="button"
                      className="location-dropdown-close-btn"
                      onClick={() => setShowLocationDropdown(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                        cursor: 'pointer',
                        color: 'var(--text-gray)',
                        padding: '0 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Close location selector"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Select manually city options - revealed only after clicking Select manually */}
                  {showManualCities ? (
                    <div className="manual-cities-modal-content">
                      {/* Search Bar */}
                      <div className="city-search-container" style={{ margin: '8px 0 16px 0', position: 'relative' }}>
                        <div className="sidebar-search-wrapper" style={{ border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-input)', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Search city (e.g. Noida, Jaipur)..."
                            value={citySearchQuery}
                            onChange={(e) => setCitySearchQuery(e.target.value)}
                            className="sidebar-search-input"
                            style={{ padding: '8px 30px 8px 12px', border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                          />
                          {citySearchQuery && (
                            <button 
                              type="button" 
                              onClick={() => setCitySearchQuery('')}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                color: 'var(--text-gray)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                              }}
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </div>

                      {citySearchQuery.trim() ? (
                        /* Search results view */
                        <div className="search-cities-results" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-gray)', margin: '0 0 10px 0', textAlign: 'left' }}>
                            Search Results ({uniqueCities.filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase())).length})
                          </h4>
                          <div className="location-cities-grid">
                            {uniqueCities
                              .filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase()))
                              .map(city => (
                                <button
                                  key={city}
                                  type="button"
                                  className={`city-grid-btn ${selectedCity === city ? 'active' : ''}`}
                                  onClick={() => {
                                    setSelectedCity(city);
                                    setShowLocationDropdown(false);
                                    setCitySearchQuery('');
                                    setShowManualCities(false);
                                  }}
                                >
                                  {city}
                                </button>
                              ))}
                            {uniqueCities.filter(c => c.toLowerCase().includes(citySearchQuery.toLowerCase())).length === 0 && (
                              <p style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: 'var(--text-gray)', textAlign: 'center', margin: '20px 0' }}>
                                No cities found matching "{citySearchQuery}"
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Popular Cities Grid view */
                        <div className="popular-cities-wrapper">
                          <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-gray)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
                            Popular Cities
                          </h4>
                          <div className="popular-cities-svg-grid">
                            {[
                              { name: 'Mumbai', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M12 56h40M18 56V26h28v30M24 56V38c0-3 3-5 8-5s8 2 8 5v18M14 26h36M18 26c0-6 6-10 14-10s14 4 14 10" /><circle cx="32" cy="10" r="2" /></svg> },
                              { name: 'Delhi', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M16 56h32M22 56V20c0-4 4-8 10-8s10 4 10 8v36M26 56V40c0-3 2-5 6-5s6 2 6 5v16M22 26h20M14 56V48h6v8M44 56h6v-8h-6" /></svg> },
                              { name: 'Bangalore', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M8 56h48M16 56V32h32v24M16 38h32M32 32V20M24 20h16M28 20c0-4 2-6 4-6s4 2 4 6M20 56V44h8v12M36 56V44h8v12" /></svg> },
                              { name: 'Pune', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M10 56h44M16 56V24l8-8 8 4 8-4 8 8v32M24 56V36h16v20M20 30h8M36 30h8" /></svg> },
                              { name: 'Hyderabad', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M14 56h36M18 56V16c0-2 2-4 4-4s4 2 4 4v40M38 56V16c0-2 2-4 4-4s4 2 4 4v40M26 44h12M18 36h28M26 28h12M22 12V8h4M42 12V8h4" /></svg> },
                              { name: 'Chennai', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M12 56h40M32 12l-14 36h28L32 12zM24 48h16M28 38h8M32 12V8M20 48v8M44 48v8" /></svg> },
                              { name: 'Kolkata', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M6 50h52M12 50l4-24h32l4 24M16 26V14h32v12M12 50L32 26M52 50L32 26M22 26V50M42 26V50" /></svg> },
                              { name: 'Ahmedabad', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M16 56V26c0-6 6-12 16-12s16 6 16 12v30M24 26a8 8 0 0116 0M32 14v42M10 56h44" /></svg> },
                              { name: 'Chandigarh', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M16 56V40c0-6 4-10 10-10h4c4 0 6 2 8 6l6-8c2-2 6-2 8 0s2 6 0 8L36 50H22v6M12 56h20" /></svg> },
                              { name: 'Jaipur', svg: <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="city-svg"><path d="M12 56h40M18 56V28h28v28M24 28V16l8-6 8 6v12M24 38h16M24 48h16" /></svg> }
                            ].map(cityItem => (
                              <button
                                key={cityItem.name}
                                type="button"
                                className={`popular-city-card ${selectedCity === cityItem.name ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedCity(cityItem.name);
                                  setShowLocationDropdown(false);
                                  setShowManualCities(false);
                                }}
                              >
                                <div className="popular-city-icon-box">
                                  {cityItem.svg}
                                </div>
                                <span className="popular-city-name">{cityItem.name}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              className={`popular-city-card ${selectedCity === 'all' ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedCity('all');
                                setShowLocationDropdown(false);
                                setShowManualCities(false);
                              }}
                              style={{ borderStyle: 'dashed' }}
                            >
                              <div className="popular-city-icon-box" style={{ fontSize: '1.5rem', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                🌐
                              </div>
                              <span className="popular-city-name">All Cities</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="location-action-buttons-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Use current location */}
                      <button
                        type="button"
                        className={`location-detect-btn ${isDetectingLocation ? 'detecting' : ''}`}
                        onClick={async () => {
                          await handleDetectLocation();
                          setShowLocationDropdown(false);
                        }}
                        disabled={isDetectingLocation}
                      >
                        📍 {isDetectingLocation ? 'Detecting Location...' : 'Use current location'}
                      </button>

                      {/* Select manually button of matching style & size */}
                      <button
                        type="button"
                        className="location-detect-btn"
                        onClick={() => {
                          setShowManualCities(true);
                        }}
                      >
                        ✍️ Select manually
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* Preowned Cars */}
          <div className="nav-item-dropdown">
            <span
              className={`nav-link ${currentView === 'preowned' || currentView === 'ai-recommend' ? 'active' : ''}`}
              onClick={() => { setCurrentView('preowned'); setSelectedCarId(null); }}
            >
              Preowned Cars ▾
            </span>
            <div className="dropdown-menu">
              <button className="dropdown-menu-item" onClick={() => { setCurrentView('preowned'); setTabSelected('all'); setSelectedMakes([]); setSelectedCity('all'); setSortBy('year_desc'); setLocalSearchTerm(''); setSelectedCarId(null); }}>Search All Cars</button>
              <button className="dropdown-menu-item" onClick={() => { setCurrentView('preowned'); setTabSelected('luxe'); setSelectedCarId(null); }}>Luxury Cars</button>
              <button className="dropdown-menu-item" onClick={() => { setCurrentView('ai-recommend'); setSelectedCarId(null); }}>AI Recommendation Assistant</button>
            </div>
          </div>

          {/* Sell Car */}
          <div className="nav-item-dropdown">
            <span
              className={`nav-link ${['sell', 'sell-valuation', 'sell-inspection', 'sell-my-listings', 'sell-tracker', 'sell-tips'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('sell')}
            >
              Sell Car ▾
            </span>
            <div className="dropdown-menu">
              <button className="dropdown-menu-item" onClick={() => { setCurrentView('sell'); setShowMyListingsOnly(false); setSellSuccess(false); setSellError(null); }}>List a Used Car</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('sell-valuation')}>Free Car Valuation</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('sell-inspection')}>Book Vehicle Inspection</button>
              <button className="dropdown-menu-item" onClick={() => {
                if (!user || !token) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('sell-my-listings');
                  setSelectedCarId(null);
                }
              }}>My Listings</button>
              <button className="dropdown-menu-item" onClick={() => {
                if (!user || !token) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('sell-tracker');
                }
              }}>Track Listing Status</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('sell-tips')}>Selling Tips</button>
            </div>
          </div>

          {/* Car Loan */}
          <div className="nav-item-dropdown">
            <span
              className={`nav-link ${['loan-apply', 'loan-calculator', 'loan-eligibility', 'loan-compare', 'loan-docs', 'loan-faqs', 'loan-track'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('loan-apply')}
            >
              Car Loan ▾
            </span>
            <div className="dropdown-menu">
              <button className="dropdown-menu-item" onClick={() => {
                setCurrentView('loan-apply');
                setLoanSuccess(null);
              }}>Apply for Loan</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('loan-eligibility')}>Loan Eligibility Checker</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('loan-compare')}>Compare Loan Offers</button>
              <button className="dropdown-menu-item" onClick={() => {
                setCurrentView('loan-calculator');
              }}>Interest Rate Calculator</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('loan-docs')}>Required Documents</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('loan-faqs')}>Loan FAQs</button>
              <button className="dropdown-menu-item" onClick={() => {
                if (!user || !token) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('loan-track');
                }
              }}>Track Application</button>
            </div>
          </div>

          {/* New Cars */}
          <div className="nav-item-dropdown">
            <span
              className={`nav-link ${['new-cars', 'new-launches', 'new-compare', 'new-test-drive', 'new-brochure', 'new-offers'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('new-cars')}
            >
              New Cars ▾
            </span>
            <div className="dropdown-menu">
              <button className="dropdown-menu-item" onClick={() => { setCurrentView('new-cars'); setSelectedNewCar(null); }}>Upcoming Cars</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('new-launches')}>Latest Launches</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('new-compare')}>Compare New Cars</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('new-test-drive')}>Book Test Drive</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('new-brochure')}>Download Brochure</button>
              <button className="dropdown-menu-item" onClick={() => {
                setCurrentView('new-cars');
                setSelectedNewCar('General New Car Inquiry');
                setNewCarSuccess(false);
                setNewCarError(null);
              }}>Submit Inquiry</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('new-offers')}>New Car Offers</button>
            </div>
          </div>

          {/* Car Services */}
          <div className="nav-item-dropdown">
            <span
              className={`nav-link ${['services', 'services-insurance', 'services-inspection', 'services-rsa', 'services-history', 'services-centers', 'services-wash'].includes(currentView) ? 'active' : ''}`}
              onClick={() => setCurrentView('services')}
            >
              Car Services ▾
            </span>
            <div className="dropdown-menu">
              <button className="dropdown-menu-item" onClick={() => { setCurrentView('services'); setSelectedService('Periodic Engine Oil Service'); }}>Book Car Service</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('services-insurance')}>Insurance Renewal</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('services-inspection')}>Car Inspection</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('services-wash')}>Car Wash</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('services-rsa')}>Roadside Assistance</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('services-history')}>Service History</button>
              <button className="dropdown-menu-item" onClick={() => setCurrentView('services-centers')}>Find Nearby Service Centers</button>
            </div>
          </div>

        </nav>

        <div className="header-right">
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle light and dark mode themes"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="call-us-btn" onClick={() => setShowCallbackModal(true)}>📞 Call Us</button>
          <button
            className={`wishlist-toggle-btn ${showWishlistOnly ? 'active' : ''}`}
            onClick={() => { setShowWishlistOnly(!showWishlistOnly); setSelectedCarId(null); setCurrentView('preowned'); }}
            title={showWishlistOnly ? "Show All Cars" : "Show Wishlisted Cars"}
            aria-label="Toggle wishlist filter"
          >
            ❤️ {wishlist.length > 0 ? `${wishlist.length}` : '0'}
          </button>
          <div
            className="profile-section"
            onClick={() => (user && token) ? setShowUserDropdown(!showUserDropdown) : setShowAuthModal(true)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            👤 Hello, {(user && token) ? user.name.split(' ')[0] : 'Sign in'}
            <strong>Account ▾</strong>
            {showUserDropdown && user && token && (
              <div className="user-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-user-info">
                  <div className="info-name">{user.name}</div>
                  <div className="info-role" style={{ display: 'inline-block', marginTop: '4px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 111, 84, 0.1)', color: 'var(--orange, #ff6f54)', border: '1px solid rgba(255, 111, 84, 0.25)' }}>
                    🔑 {user.role} Account
                  </div>
                  <div className="info-email">{user.email}</div>
                  <div className="info-phone">{user.phone}</div>
                </div>
                {(user.role === 'Dealer' || user.role === 'Admin') && (
                  <button
                    onClick={() => {
                      setCurrentView('admin-leads');
                      setShowUserDropdown(false);
                      setSelectedCarId(null);
                    }}
                    className="dashboard-profile-btn"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      borderRadius: 'var(--radius-input)',
                      cursor: 'pointer',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-dark)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    📊 Leads Dashboard
                  </button>
                )}
                <button onClick={handleLogout} className="logout-btn">
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Search Button */}
          <button
            className="mobile-search-btn"
            onClick={() => setIsSearchingMobile(true)}
            aria-label="Search cars semantically"
            title="Search Cars"
          >
            <SearchIcon style={{ width: '20px', height: '20px' }} />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            className={`hamburger-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>

        {isSearchingMobile && (
          <div className="mobile-search-overlay">
            <button
              className="mobile-search-back-btn"
              onClick={() => {
                setIsSearchingMobile(false);
                setLocalSearchTerm('');
                setSearchTerm('');
              }}
              aria-label="Close search"
            >
              ←
            </button>
            <div className="mobile-search-input-wrapper">
              <SearchIcon className="search-icon" style={{ width: '16px', height: '16px' }} />
              <input
                type="text"
                className="mobile-search-input"
                placeholder="Search make, model, or features..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                autoFocus
              />
              {localSearchTerm && (
                <button
                  className="mobile-search-clear-btn"
                  onClick={() => setLocalSearchTerm('')}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
            <span className="mobile-search-badge">✨ AI Search</span>
          </div>
        )}
      </header>

      {/* Mobile Drawer/Sidebar Navigation */}
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="brand-logo" onClick={() => { setSelectedCarId(null); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
            CarSaathi
          </div>
          <button className="sidebar-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            &times;
          </button>
        </div>

        <nav className="mobile-sidebar-nav">
          {/* Main quick action settings listed first */}
          <div className="mobile-sidebar-footer" style={{ borderTop: 'none', borderBottom: '1px solid var(--border-light)', paddingTop: 0, paddingBottom: '15px', marginTop: 0, marginBottom: '10px' }}>
            <div className="mobile-profile-section" onClick={() => (user && token) ? setShowUserDropdown(!showUserDropdown) : setShowAuthModal(true)} style={{ marginBottom: '0px' }}>
              <span>👤 {(user && token) ? `Hello, ${user.name.split(' ')[0]}` : 'Sign In / Register'}</span>
              {user && token && (
                <button className="mobile-logout-btn" onClick={handleLogout}>Sign Out</button>
              )}
            </div>

            <button className="mobile-sidebar-btn" onClick={() => { setShowWishlistOnly(!showWishlistOnly); setSelectedCarId(null); setCurrentView('preowned'); }}>
              ❤️ Wishlist ({wishlist.length})
            </button>

            <button className="mobile-sidebar-btn" onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            <button className="mobile-sidebar-btn" onClick={() => setShowCallbackModal(true)}>
              📞 Call Us
            </button>
          </div>

          {/* Preowned Cars */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">🚗 Preowned Cars</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('preowned'); setTabSelected('all'); setSelectedMakes([]); setSelectedCity('all'); setSortBy('year_desc'); setLocalSearchTerm(''); setSelectedCarId(null); }}>Search All Cars</button>
              <button onClick={() => { setCurrentView('preowned'); setTabSelected('luxe'); setSelectedCarId(null); }}>Luxury Cars</button>
              <button onClick={() => { setCurrentView('ai-recommend'); setSelectedCarId(null); }}>AI Recommendation Assistant</button>
            </div>
          </div>

          {/* Sell Car */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">💰 Sell Car</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('sell'); setShowMyListingsOnly(false); setSellSuccess(false); setSellError(null); }}>List a Used Car</button>
              <button onClick={() => setCurrentView('sell-valuation')}>Free Car Valuation</button>
              <button onClick={() => setCurrentView('sell-inspection')}>Book Vehicle Inspection</button>
              <button onClick={() => {
                if (!user || !token) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('sell-my-listings');
                  setSelectedCarId(null);
                }
              }}>My Listings</button>
              <button onClick={() => {
                if (!user || !token) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('sell-tracker');
                }
              }}>Track Listing Status</button>
              <button onClick={() => setCurrentView('sell-tips')}>Selling Tips</button>
            </div>
          </div>

          {/* Car Loan */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">💳 Car Loan</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('loan-apply'); setLoanSuccess(null); }}>Apply for Loan</button>
              <button onClick={() => setCurrentView('loan-eligibility')}>Loan Eligibility Checker</button>
              <button onClick={() => setCurrentView('loan-compare')}>Compare Loan Offers</button>
              <button onClick={() => setCurrentView('loan-calculator')}>Interest Rate Calculator</button>
              <button onClick={() => setCurrentView('loan-docs')}>Required Documents</button>
              <button onClick={() => setCurrentView('loan-faqs')}>Loan FAQs</button>
              <button onClick={() => {
                if (!user || !token) {
                  setShowAuthModal(true);
                } else {
                  setCurrentView('loan-track');
                }
              }}>Track Application</button>
            </div>
          </div>

          {/* New Cars */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">🆕 New Cars</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('new-cars'); setSelectedNewCar(null); }}>Upcoming Cars</button>
              <button onClick={() => setCurrentView('new-launches')}>Latest Launches</button>
              <button onClick={() => setCurrentView('new-compare')}>Compare New Cars</button>
              <button onClick={() => setCurrentView('new-test-drive')}>Book Test Drive</button>
              <button onClick={() => setCurrentView('new-brochure')}>Download Brochure</button>
              <button onClick={() => {
                setCurrentView('new-cars');
                setSelectedNewCar('General New Car Inquiry');
                setNewCarSuccess(false);
                setNewCarError(null);
              }}>Submit Inquiry</button>
              <button onClick={() => setCurrentView('new-offers')}>New Car Offers</button>
            </div>
          </div>

          {/* Car Services */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">🔧 Car Services</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('services'); setSelectedService('Periodic Engine Oil Service'); }}>Book Car Service</button>
              <button onClick={() => setCurrentView('services-insurance')}>Insurance Renewal</button>
              <button onClick={() => setCurrentView('services-inspection')}>Car Inspection</button>
              <button onClick={() => setCurrentView('services-wash')}>Car Wash</button>
              <button onClick={() => setCurrentView('services-rsa')}>Roadside Assistance</button>
              <button onClick={() => setCurrentView('services-history')}>Service History</button>
              <button onClick={() => setCurrentView('services-centers')}>Find Nearby Service Centers</button>
            </div>
          </div>

          {/* Admin/Dealer Leads */}
          {user && token && (user.role === 'Admin' || user.role === 'Dealer') && (
            <div className="mobile-nav-group">
              <div className="mobile-nav-group-title" style={{ color: 'var(--orange, #ff6f54)' }}>📊 Leads Dashboard</div>
              <div className="mobile-nav-group-links">
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('bookings'); }}>Test Drive Bookings</button>
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('services'); }}>Service Center Bookings</button>
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('loans'); }}>Loan Applications</button>
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('newCarLeads'); }}>New Car Inquiries</button>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Body Container */}
      <div className="app-container">
        {currentView === 'ai-recommend' ? (
          <div className="ai-recommendation-container" style={{ width: '100%', padding: '20px 0' }}>
            <div className="tab-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2.5rem', marginTop: '15px', background: 'linear-gradient(135deg, #fff, var(--text-gray))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Find Your Perfect Car with CarSaathi AI
              </h1>
              <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', maxWidth: '600px', margin: '10px auto 0 auto' }}>
                Enter your lifestyle preferences, daily driving habits, and budget. Our AI agent will scan the CarSaathi database and pick the absolute best matches for you.
              </p>
            </div>

            {aiLoading ? (
              <div className="ai-loading-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '50px 30px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxShadow: 'var(--shadow-card)' }}>
                <div className="ai-pulsing-circle" style={{ width: '80px', height: '80px', margin: '0 auto 20px auto', background: 'linear-gradient(135deg, var(--brand), var(--orange))', color: '#fff', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 0 30px rgba(133, 112, 245, 0.6)', animation: 'pulse 1.5s infinite alternate' }}>
                  ✨
                </div>
                <h3 style={{ fontSize: '1.4rem', margin: '20px 0 10px 0' }}>AI Assistant is Thinking...</h3>
                <div className="ai-loading-steps" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '20px' }}>
                  <div className={`ai-loading-step ${aiLoadingStep >= 0 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: aiLoadingStep >= 0 ? 'var(--orange)' : 'var(--text-light)', transition: 'all 0.3s' }}>
                    <span>{aiLoadingStep > 0 ? '✓' : '⚡'}</span>
                    <span>Scanning CarSaathi database for live preowned listings...</span>
                  </div>
                  <div className={`ai-loading-step ${aiLoadingStep >= 1 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: aiLoadingStep >= 1 ? 'var(--orange)' : 'var(--text-light)', transition: 'all 0.3s' }}>
                    <span>{aiLoadingStep > 1 ? '✓' : aiLoadingStep === 1 ? '⚡' : '○'}</span>
                    <span>Filtering by budget constraint & body type parameters...</span>
                  </div>
                  <div className={`ai-loading-step ${aiLoadingStep >= 2 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: aiLoadingStep >= 2 ? 'var(--orange)' : 'var(--text-light)', transition: 'all 0.3s' }}>
                    <span>{aiLoadingStep > 2 ? '✓' : aiLoadingStep === 2 ? '⚡' : '○'}</span>
                    <span>Gemini is evaluating safety ratings, mileage, and utility...</span>
                  </div>
                  <div className={`ai-loading-step ${aiLoadingStep >= 3 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: aiLoadingStep >= 3 ? 'var(--orange)' : 'var(--text-light)', transition: 'all 0.3s' }}>
                    <span>{aiLoadingStep === 3 ? '⚡' : '○'}</span>
                    <span>Compiling matches and drafting custom reasoning...</span>
                  </div>
                </div>
              </div>
            ) : aiRecommendations.length > 0 ? (
              <div className="ai-results-wrapper" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Back to preferences link */}
                <div className="details-back-bar" onClick={() => setAiRecommendations([])} style={{ marginBottom: '20px', display: 'inline-flex' }}>
                  <span>← Edit AI Preferences / Search Again</span>
                </div>

                {/* Verdict summary card */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '30px', boxShadow: 'var(--shadow-subtle)' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🤖 AI Assistant's Verdict & Matched Database Listings
                  </h3>
                  <p style={{ color: 'var(--text-gray)', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                    {aiVerdict}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                    {aiRecommendations.map(rec => {
                      const fullCar = allCars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId)) || cars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId));
                      if (!fullCar) return null;
                      return (
                        <div
                          key={rec.carId}
                          onClick={() => { setSelectedCarId(fullCar.id); setSelectedCar(fullCar); setCurrentView('preowned'); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, rgba(133, 112, 245, 0.12), rgba(255, 111, 84, 0.12))',
                            border: '1px solid var(--brand)',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: 'var(--text-dark)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                          }}
                          title="Click to view car details"
                        >
                          <span>🚗 {fullCar.year} {fullCar.make} {fullCar.model}</span>
                          <span style={{ color: 'var(--orange)', fontWeight: 'bold' }}>{formatINR(fullCar.price)}</span>
                          <span style={{ fontSize: '0.75rem', background: 'var(--brand)', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{fullCar.city}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Results Grid */}
                <div className="ai-results-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {aiRecommendations.map((rec) => {
                    // Match the recommended car with real database details
                    const fullCar = allCars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId)) || cars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId));
                    if (!fullCar) return null;

                    return (
                      <div key={rec.carId} className="ai-rec-card" style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', overflow: 'hidden', transition: 'all 0.3s', boxShadow: 'var(--shadow-subtle)' }}>
                        <div className="ai-rec-img-wrapper" style={{ width: '320px', minWidth: '320px', position: 'relative', cursor: 'pointer' }} onClick={() => { setSelectedCarId(fullCar.id); setSelectedCar(fullCar); setCurrentView('preowned'); }}>
                          <img src={getCarImageUrl(fullCar)} alt={`${fullCar.make} ${fullCar.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={handleImageError} />
                          <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {fullCar.city}
                          </div>
                        </div>

                        <div className="ai-rec-content-wrapper" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div className="ai-rec-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>
                                {fullCar.year} {fullCar.make} {fullCar.model}
                              </h3>
                              <span className="ai-rec-match-score" style={{ padding: '6px 12px', borderRadius: '20px', background: rec.matchScore >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(133, 112, 245, 0.15)', color: rec.matchScore >= 90 ? '#10b981' : 'var(--brand)', fontWeight: 'bold', fontSize: '0.85rem', border: `1px solid ${rec.matchScore >= 90 ? '#10b981' : 'var(--brand)'}` }}>
                                ✨ {rec.matchScore}% Match
                              </span>
                            </div>

                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--orange)', marginBottom: '16px' }}>
                              {formatINR(fullCar.price)}
                            </div>

                            {/* Why AI recommends this */}
                            <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: 'var(--radius-input)', borderLeft: '4px solid var(--brand)', marginBottom: '16px' }}>
                              <span style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--brand)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                Why AI recommends this:
                              </span>
                              <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                {rec.reason}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => { setSelectedCarId(fullCar.id); setSelectedCar(fullCar); setCurrentView('preowned'); }}
                              className="call-us-btn"
                              style={{ flex: 1, padding: '10px 16px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', textAlign: 'center' }}
                            >
                              Inspect Details & Book Test Drive
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="ai-form-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '32px', maxWidth: '750px', margin: '0 auto', boxShadow: 'var(--shadow-card)' }}>
                {aiError && (
                  <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-input)', color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem' }}>
                    {aiError}
                  </div>
                )}

                <form onSubmit={handleGetAiRecommendations} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Grid for parameters */}
                  <div className="ai-params-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Budget Selector */}
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                        Maximum Budget
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="300000"
                          max="9000000"
                          step="50000"
                          value={aiBudget}
                          onChange={(e) => setAiBudget(Number(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--brand)' }}
                        />
                        <span style={{ width: '100px', fontWeight: 'bold', color: 'var(--orange)', textAlign: 'right', fontSize: '0.95rem' }}>
                          ₹{(aiBudget / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>

                    {/* Driving Purpose */}
                    <div>
                      <label htmlFor="ai-purpose" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                        Primary Driving Purpose
                      </label>
                      <select
                        id="ai-purpose"
                        value={aiPurpose}
                        onChange={(e) => setAiPurpose(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', cursor: 'pointer' }}
                      >
                        <option value="commuting">Daily City Commute</option>
                        <option value="family">Family Road Trips</option>
                        <option value="adventure">Off-Road & Adventure</option>
                        <option value="luxury">Luxury & Comfort</option>
                        <option value="performance">Speed & Performance</option>
                      </select>
                    </div>

                    {/* Fuel Preference */}
                    <div>
                      <label htmlFor="ai-fuel" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                        Fuel Type Preference
                      </label>
                      <select
                        id="ai-fuel"
                        value={aiFuelType}
                        onChange={(e) => setAiFuelType(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', cursor: 'pointer' }}
                      >
                        <option value="Any">No Preference (Any)</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric / EV</option>
                        <option value="CNG">CNG</option>
                      </select>
                    </div>

                    {/* Body Type Preference */}
                    <div>
                      <label htmlFor="ai-body" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                        Body Style Preference
                      </label>
                      <select
                        id="ai-body"
                        value={aiBodyType}
                        onChange={(e) => setAiBodyType(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', cursor: 'pointer' }}
                      >
                        <option value="Any">No Preference (Any)</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV (Sports Utility)</option>
                        <option value="MUV">MUV / MPV (Multi-Purpose)</option>
                      </select>
                    </div>
                  </div>

                  {/* Priority Pill Selectors */}
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', fontSize: '0.9rem' }}>
                      What is your absolute highest priority?
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {[
                        { key: 'comfort', label: '🛋️ Ride Comfort' },
                        { key: 'safety', label: '🛡️ Safety & Build' },
                        { key: 'mileage', label: '⛽ Fuel Efficiency' },
                        { key: 'performance', label: '🏎️ Engine Performance' },
                        { key: 'maintenance', label: '🔧 Low Maintenance' }
                      ].map(p => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setAiPriority(p.key)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: aiPriority === p.key ? 'var(--brand)' : 'var(--border-light)',
                            background: aiPriority === p.key ? 'rgba(133, 112, 245, 0.15)' : 'var(--bg-tertiary)',
                            color: aiPriority === p.key ? 'var(--brand)' : 'var(--text-dark)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Description Textarea */}
                  <div>
                    <label htmlFor="ai-prompt-desc" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                      Describe any specific needs in your own words (Optional)
                    </label>
                    <textarea
                      id="ai-prompt-desc"
                      placeholder="e.g. I need a robust family SUV with automatic transmission under 15 Lakh for highway trips and weekend travel..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      style={{ width: '100%', height: '100px', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', resize: 'vertical', fontSize: '0.95rem' }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="booking-submit-btn"
                    style={{ background: 'linear-gradient(135deg, var(--brand), var(--orange))', color: '#fff', border: 'none', fontSize: '1.1rem', padding: '14px', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: '700', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(255, 111, 84, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    ✨ Analyze & Recommend Perfect Matches
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : currentView === 'admin-leads' ? (
          <div className="admin-leads-container">
            <div className="tab-header" style={{ marginBottom: '30px' }}>
              <h1>📊 Leads & Bookings Dashboard</h1>
              <p>Real-time overview of all customer inquiries, test drive requests, financing applications, and service bookings.</p>
            </div>

            {/* Dashboard Tabs */}
            <div className="tab-switcher" style={{ justifyContent: 'flex-start', borderBottom: '2px solid rgba(156, 163, 175, 0.1)', paddingBottom: '10px', marginBottom: '20px', gap: '15px' }}>
              <button
                className={`tab-btn ${activeAdminTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveAdminTab('bookings')}
                style={{ borderRadius: '6px', padding: '8px 16px', border: 'none', background: activeAdminTab === 'bookings' ? 'var(--orange, #ff6f54)' : 'transparent', color: activeAdminTab === 'bookings' ? '#fff' : 'var(--text-dark, #1f2937)', cursor: 'pointer', fontWeight: '600' }}
              >
                🚗 Test Drives ({adminLeads?.bookings?.length || 0})
              </button>
              <button
                className={`tab-btn ${activeAdminTab === 'services' ? 'active' : ''}`}
                onClick={() => setActiveAdminTab('services')}
                style={{ borderRadius: '6px', padding: '8px 16px', border: 'none', background: activeAdminTab === 'services' ? 'var(--orange, #ff6f54)' : 'transparent', color: activeAdminTab === 'services' ? '#fff' : 'var(--text-dark, #1f2937)', cursor: 'pointer', fontWeight: '600' }}
              >
                🔧 Service Appointments ({adminLeads?.services?.length || 0})
              </button>
              <button
                className={`tab-btn ${activeAdminTab === 'loans' ? 'active' : ''}`}
                onClick={() => setActiveAdminTab('loans')}
                style={{ borderRadius: '6px', padding: '8px 16px', border: 'none', background: activeAdminTab === 'loans' ? 'var(--orange, #ff6f54)' : 'transparent', color: activeAdminTab === 'loans' ? '#fff' : 'var(--text-dark, #1f2937)', cursor: 'pointer', fontWeight: '600' }}
              >
                💰 Loan Applications ({adminLeads?.loans?.length || 0})
              </button>
              <button
                className={`tab-btn ${activeAdminTab === 'newCarLeads' ? 'active' : ''}`}
                onClick={() => setActiveAdminTab('newCarLeads')}
                style={{ borderRadius: '6px', padding: '8px 16px', border: 'none', background: activeAdminTab === 'newCarLeads' ? 'var(--orange, #ff6f54)' : 'transparent', color: activeAdminTab === 'newCarLeads' ? '#fff' : 'var(--text-dark, #1f2937)', cursor: 'pointer', fontWeight: '600' }}
              >
                🆕 New Cars Leads ({adminLeads?.newCarLeads?.length || 0})
              </button>
            </div>

            {isAdminLeadsLoading ? (
              <div className="details-loading-box">
                <div className="details-spinner"></div>
                <h3>Loading Dashboard...</h3>
              </div>
            ) : adminLeadsError ? (
              <div className="sell-success-box" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <h2>⚠️ Error</h2>
                <p>{adminLeadsError}</p>
              </div>
            ) : adminLeads ? (
              <div className="admin-leads-content" style={{ overflowX: 'auto', background: 'var(--card-bg, #fff)', border: '1px solid rgba(156, 163, 175, 0.15)', borderRadius: '12px', padding: '20px' }}>

                {/* Bookings Table */}
                {activeAdminTab === 'bookings' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                        <th style={{ padding: '12px' }}>Customer Name</th>
                        <th style={{ padding: '12px' }}>Phone Number</th>
                        <th style={{ padding: '12px' }}>Car Model</th>
                        <th style={{ padding: '12px' }}>Booking Date</th>
                        <th style={{ padding: '12px' }}>Time Slot</th>
                        <th style={{ padding: '12px' }}>Requested At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLeads.bookings.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No test drive bookings found.</td></tr>
                      ) : adminLeads.bookings.map((b: any) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{b.name}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{b.phone}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{b.make} {b.model}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{new Date(b.booking_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{b.booking_time}</td>
                          <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(b.created_at).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Services Table */}
                {activeAdminTab === 'services' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                        <th style={{ padding: '12px' }}>Customer Name</th>
                        <th style={{ padding: '12px' }}>Phone Number</th>
                        <th style={{ padding: '12px' }}>Service Name</th>
                        <th style={{ padding: '12px' }}>City</th>
                        <th style={{ padding: '12px' }}>Appointment Date</th>
                        <th style={{ padding: '12px' }}>Requested At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLeads.services.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No service bookings found.</td></tr>
                      ) : adminLeads.services.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{s.name}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{s.phone}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{s.service_name}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{s.city}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{new Date(s.booking_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(s.created_at).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Loans Table */}
                {activeAdminTab === 'loans' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                        <th style={{ padding: '12px' }}>Applicant</th>
                        <th style={{ padding: '12px' }}>Phone</th>
                        <th style={{ padding: '12px' }}>Income (Monthly)</th>
                        <th style={{ padding: '12px' }}>Employment</th>
                        <th style={{ padding: '12px' }}>Credit Score</th>
                        <th style={{ padding: '12px' }}>Loan Amount</th>
                        <th style={{ padding: '12px' }}>Tenure</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLeads.loans.length === 0 ? (
                        <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No loan applications found.</td></tr>
                      ) : adminLeads.loans.map((l: any) => (
                        <tr key={l.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{l.name}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.phone}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>₹{l.income.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.employment}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.credit_score}</td>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--orange)' }}>₹{l.loan_amount.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{l.tenure_years} years</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: l.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: l.status === 'Approved' ? '#10b981' : '#f59e0b'
                            }}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* New Car Inquiries */}
                {activeAdminTab === 'newCarLeads' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(156, 163, 175, 0.15)', height: '40px' }}>
                        <th style={{ padding: '12px' }}>Customer Name</th>
                        <th style={{ padding: '12px' }}>Phone Number</th>
                        <th style={{ padding: '12px' }}>Email</th>
                        <th style={{ padding: '12px' }}>City</th>
                        <th style={{ padding: '12px' }}>Car Model Interest</th>
                        <th style={{ padding: '12px' }}>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLeads.newCarLeads.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No inquiries found.</td></tr>
                      ) : adminLeads.newCarLeads.map((n: any) => (
                        <tr key={n.id} style={{ borderBottom: '1px solid rgba(156, 163, 175, 0.1)', height: '45px' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-dark)' }}>{n.name}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.phone}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.email}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.city}</td>
                          <td style={{ padding: '12px', color: 'var(--text-dark)' }}>{n.car_name}</td>
                          <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.85rem' }}>{new Date(n.created_at).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No dashboard data loaded.
              </div>
            )}
          </div>
        ) : currentView === 'sell' ? (
          <div className="sell-car-container">
            <div className="tab-header">
              <h1>List Your Car for Sale</h1>
              <p>Sell your car directly to verified buyers on CarSaathi. Get the best price with zero middleman commission.</p>
            </div>

            <div className="sell-car-grid">
              <div className="sell-form-left">
                {!user || !token ? (
                  <div className="sell-success-box" style={{ background: 'rgba(255, 111, 84, 0.05)', border: '1px solid rgba(255, 111, 84, 0.25)' }}>
                    <div className="success-icon">🔒</div>
                    <h2 style={{ color: 'var(--orange)' }}>Authentication Required</h2>
                    <p>Please log in to list your car on CarSaathi. We require user verification to prevent spam and fraudulent listings.</p>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="view-listings-btn"
                      style={{ backgroundColor: 'var(--orange)' }}
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : user.role !== 'Dealer' && user.role !== 'Admin' ? (
                  <div className="sell-success-box" style={{ background: 'rgba(255, 111, 84, 0.05)', border: '1px solid rgba(255, 111, 84, 0.25)' }}>
                    <div className="success-icon">💼</div>
                    <h2 style={{ color: 'var(--orange)' }}>Dealer Account Required</h2>
                    <p>Only verified Dealers or Administrators can list commercial vehicles for sale on CarSaathi. Customers can only browse and book listings.</p>
                  </div>
                ) : sellSuccess ? (
                  <div className="sell-success-box">
                    <div className="success-icon">🚀</div>
                    <h2>Listing Created Successfully!</h2>
                    <p>Your car is now listed live on CarSaathi database. It is instantly searchable by thousands of buyers across cities.</p>
                    <button
                      onClick={() => { setSellSuccess(false); setCurrentView('preowned'); }}
                      className="view-listings-btn"
                    >
                      ← View on Preowned Listings Page
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSellSubmit} className="sell-form-box">
                    {sellError && <div className="sell-error-msg">⚠️ {sellError}</div>}

                    <div className="sell-field-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-make">Make / Brand</label>
                        <input
                          type="text"
                          id="sell-make"
                          value={sellForm.make}
                          onChange={(e) => setSellForm({ ...sellForm, make: e.target.value })}
                          placeholder="e.g. Maruti Suzuki, Hyundai"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-model">Model</label>
                        <input
                          type="text"
                          id="sell-model"
                          value={sellForm.model}
                          onChange={(e) => setSellForm({ ...sellForm, model: e.target.value })}
                          placeholder="e.g. Swift, Creta, Nexon"
                          required
                        />
                      </div>
                    </div>

                    <div className="sell-field-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-year">Year of Manufacture</label>
                        <input
                          type="number"
                          id="sell-year"
                          value={sellForm.year}
                          min="1990"
                          max="2027"
                          onChange={(e) => setSellForm({ ...sellForm, year: parseInt(e.target.value, 10) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-price">Price (in ₹ INR)</label>
                        <input
                          type="number"
                          id="sell-price"
                          value={sellForm.price}
                          onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })}
                          placeholder="e.g. 550000"
                          required
                        />
                      </div>
                    </div>

                    <div className="sell-field-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-fuel">Fuel Type</label>
                        <select
                          id="sell-fuel"
                          value={sellForm.fuel_type}
                          onChange={(e) => setSellForm({ ...sellForm, fuel_type: e.target.value })}
                          required
                        >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="EV">EV</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-transmission">Transmission</label>
                        <select
                          id="sell-transmission"
                          value={sellForm.transmission}
                          onChange={(e) => setSellForm({ ...sellForm, transmission: e.target.value })}
                          required
                        >
                          <option value="Manual">Manual</option>
                          <option value="Automatic">Automatic</option>
                        </select>
                      </div>
                    </div>

                    <div className="sell-field-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-kms">Kilometers Driven</label>
                        <input
                          type="number"
                          id="sell-kms"
                          value={sellForm.kms_driven}
                          onChange={(e) => setSellForm({ ...sellForm, kms_driven: e.target.value })}
                          placeholder="e.g. 25000"
                          min="0"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-owners">No. of Owners</label>
                        <select
                          id="sell-owners"
                          value={sellForm.owners}
                          onChange={(e) => setSellForm({ ...sellForm, owners: e.target.value })}
                          required
                        >
                          <option value="1st Owner">1st Owner</option>
                          <option value="2nd Owner">2nd Owner</option>
                          <option value="3rd Owner">3rd Owner</option>
                          <option value="4th Owner & Above">4th Owner & Above</option>
                        </select>
                      </div>
                    </div>

                    <div className="sell-field-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-rto">Registration RTO</label>
                        <input
                          type="text"
                          id="sell-rto"
                          value={sellForm.rto}
                          onChange={(e) => setSellForm({ ...sellForm, rto: e.target.value.toUpperCase() })}
                          placeholder="e.g. DL-02"
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="sell-city">City / Location</label>
                        <select
                          id="sell-city"
                          value={sellForm.city}
                          onChange={(e) => setSellForm({ ...sellForm, city: e.target.value })}
                          required
                        >
                          <option value="">Select City</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Bangalore">Bangalore</option>
                          <option value="Pune">Pune</option>
                          <option value="Kolkata">Kolkata</option>
                          <option value="Chennai">Chennai</option>
                          <option value="Hyderabad">Hyderabad</option>
                          <option value="Jaipur">Jaipur</option>
                          <option value="Lucknow">Lucknow</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="sell-photo">Car Photo</label>
                      <input
                        type="file"
                        id="sell-photo"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setSellForm({ ...sellForm, imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {sellForm.imageUrl && (
                        <div className="sell-photo-preview" style={{ marginTop: '10px' }}>
                          <img
                            src={sellForm.imageUrl}
                            alt="Preview"
                            style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                            onError={handleImageError}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="sell-submit-btn"
                      disabled={isSellLoading}
                    >
                      {isSellLoading ? 'Submitting Listing...' : 'Publish Listing'}
                    </button>
                  </form>
                )}
              </div>

              <div className="sell-guide-right">
                <h2>Why list on CarSaathi?</h2>
                <div className="guide-item">
                  <span className="guide-icon">💰</span>
                  <div>
                    <h3>100% Free Listing</h3>
                    <p>No hidden charges, fees or listing costs. You get the full value of the selling price.</p>
                  </div>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">🔍</span>
                  <div>
                    <h3>Instant Search Visibility</h3>
                    <p>Listed cars are compiled and indexed immediately into our high-performance full text search database.</p>
                  </div>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">🛡️</span>
                  <div>
                    <h3>CarSaathi Certified Tag</h3>
                    <p>Opt for a doorstep 140-point certification to earn a verification check badge and sell 3x faster.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'loan-apply' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <div className="sub-option-page-card" style={{ margin: 0 }}>
                <div className="sub-option-page-header">
                  <h2>Apply for Car Loan</h2>
                  <p>Get pre-approved in minutes with our bank integration network.</p>
                </div>

                {loanSuccess ? (
                  <div className="loan-success-certificate">
                    <div className="success-icon">🏆</div>
                    <h2 style={{ fontSize: '1.4rem', color: '#10b981', margin: '8px 0' }}>Instant Pre-Approval Certificate</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)' }}>Congratulations! Based on your criteria, you are eligible for our pre-approved loan offer.</p>
                    <div className="certificate-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0', padding: '16px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'left', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Applicant Name:</span> <strong>{loanSuccess.name}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phone Number:</span> <strong>{loanSuccess.phone}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Loan Eligibility:</span> <strong style={{ color: '#10b981' }}>₹ {loanSuccess.loan_amount.toLocaleString('en-IN')}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tenure Choice:</span> <strong>{loanSuccess.tenure_years} Years</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span> <strong className="status-badge-approved" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '12px' }}>{loanSuccess.status}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reference ID:</span> <strong>CS-LN-{loanSuccess.id}</strong></div>
                    </div>
                    <p className="cert-note" style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>Our banking partner will contact you shortly to complete the zero-documentation digital verification process.</p>
                    <button onClick={() => setLoanSuccess(null)} className="cert-recalc-btn" style={{ padding: '10px 20px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '12px' }}>
                      Apply again
                    </button>
                  </div>
                ) : (
                  <div className="loan-form-box">
                    <form onSubmit={handleLoanSubmit} className="booking-form-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                      {loanError && <div className="booking-error-msg" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ {loanError}</div>}

                      <div className="booking-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="loan-name" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Full Name</label>
                        <input
                          type="text"
                          id="loan-name"
                          value={loanForm.name}
                          onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                          placeholder="As on PAN Card"
                          style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}
                          required
                        />
                      </div>

                      <div className="booking-field-row" style={{ display: 'flex', gap: '12px' }}>
                        <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="loan-phone" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Phone Number</label>
                          <input
                            type="tel"
                            id="loan-phone"
                            value={loanForm.phone}
                            onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                            placeholder="Mobile number"
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                            required
                          />
                        </div>
                        <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="loan-income" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Monthly Net Salary (₹)</label>
                          <input
                            type="number"
                            id="loan-income"
                            value={loanForm.income}
                            onChange={(e) => setLoanForm({ ...loanForm, income: e.target.value })}
                            placeholder="e.g. 65000"
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                            required
                          />
                        </div>
                      </div>

                      <div className="booking-field-row" style={{ display: 'flex', gap: '12px' }}>
                        <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="loan-employment" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Employment Type</label>
                          <select
                            id="loan-employment"
                            value={loanForm.employment}
                            onChange={(e) => setLoanForm({ ...loanForm, employment: e.target.value })}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                          >
                            <option value="Salaried">Salaried</option>
                            <option value="Self Employed">Self Employed</option>
                            <option value="Business Owner">Business Owner</option>
                          </select>
                        </div>
                        <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label htmlFor="loan-credit" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Credit Score Estimate</label>
                          <select
                            id="loan-credit"
                            value={loanForm.creditScore}
                            onChange={(e) => setLoanForm({ ...loanForm, creditScore: e.target.value })}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                          >
                            <option value="750+ (Excellent)">750+ (Excellent)</option>
                            <option value="700-750 (Good)">700-750 (Good)</option>
                            <option value="650-700 (Fair)">650-700 (Fair)</option>
                            <option value="Below 650 (Needs Work)">Below 650 (Needs Work)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="booking-submit-btn"
                        disabled={isLoanLoading}
                        style={{ marginTop: '12px', padding: '12px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.92rem', width: '100%' }}
                      >
                        {isLoanLoading ? 'Checking credit profile...' : 'Get Instant Pre-Approval Offer'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="sub-option-page-card" style={{ margin: '20px 0 0 0' }}>
                <div className="sub-option-page-header">
                  <h2>Required Documents Checklist & Upload</h2>
                  <p>Upload these soft copies to expedite your digital application processing.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                  {/* Item 1: Identity Proof */}
                  <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem' }}>🪪</span>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Identity Proof</span>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-gray)' }}>Aadhaar Card, PAN Card, or Passport</span>
                        </div>
                      </div>
                      <span style={{ color: loanDocs.identityProof ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        {loanDocs.identityProof ? '✓ Uploaded' : '✗ Missing'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLoanDocs(prev => ({
                                ...prev,
                                identityProof: { name: file.name, data: reader.result as string }
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                        id="upload-identity"
                      />
                      <label
                        htmlFor="upload-identity"
                        style={{
                          padding: '6px 12px',
                          background: 'var(--orange)',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Choose File
                      </label>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {loanDocs.identityProof ? loanDocs.identityProof.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>

                  {/* Item 2: Address Proof */}
                  <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem' }}>🏠</span>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Address Proof</span>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-gray)' }}>Utility Bill, Rent Agreement, or Voter ID</span>
                        </div>
                      </div>
                      <span style={{ color: loanDocs.addressProof ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        {loanDocs.addressProof ? '✓ Uploaded' : '✗ Missing'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLoanDocs(prev => ({
                                ...prev,
                                addressProof: { name: file.name, data: reader.result as string }
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                        id="upload-address"
                      />
                      <label
                        htmlFor="upload-address"
                        style={{
                          padding: '6px 12px',
                          background: 'var(--orange)',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Choose File
                      </label>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {loanDocs.addressProof ? loanDocs.addressProof.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>

                  {/* Item 3: Income Proof */}
                  <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem' }}>📄</span>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Income Proof</span>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-gray)' }}>Salary Slips (last 3 months) or IT Returns</span>
                        </div>
                      </div>
                      <span style={{ color: loanDocs.incomeProof ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        {loanDocs.incomeProof ? '✓ Uploaded' : '✗ Missing'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLoanDocs(prev => ({
                                ...prev,
                                incomeProof: { name: file.name, data: reader.result as string }
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                        id="upload-income"
                      />
                      <label
                        htmlFor="upload-income"
                        style={{
                          padding: '6px 12px',
                          background: 'var(--orange)',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Choose File
                      </label>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {loanDocs.incomeProof ? loanDocs.incomeProof.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'loan-calculator' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <div className="sub-option-page-card" style={{ margin: 0 }}>
                <div className="sub-option-page-header">
                  <h2>EMI & Interest Calculator</h2>
                  <p>Calculate your monthly outgoings based on amount, rate, and tenure.</p>
                </div>

                <div className="calculator-slider-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--text-dark)' }}>Requested Loan Amount</span>
                    <strong style={{ color: 'var(--orange)' }}>₹ {loanAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="50000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="loan-range-slider"
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div className="slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-gray)' }}>
                    <span>₹ 1 Lakh</span>
                    <span>₹ 50 Lakhs</span>
                  </div>
                </div>

                <div className="calculator-slider-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--text-dark)' }}>Interest Rate (Annual)</span>
                    <strong style={{ color: 'var(--orange)' }}>{loanInterest}% p.a.</strong>
                  </div>
                  <input
                    type="range"
                    min="7.5"
                    max="15.0"
                    step="0.1"
                    value={loanInterest}
                    onChange={(e) => setLoanInterest(Number(e.target.value))}
                    className="loan-range-slider"
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div className="slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-gray)' }}>
                    <span>7.5%</span>
                    <span>15.0%</span>
                  </div>
                </div>

                <div className="calculator-slider-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--text-dark)' }}>Loan Tenure</span>
                    <strong style={{ color: 'var(--orange)' }}>{loanTenure} Years</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(Number(e.target.value))}
                    className="loan-range-slider"
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <div className="slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-gray)' }}>
                    <span>1 Year</span>
                    <span>7 Years</span>
                  </div>
                </div>

                {(() => {
                  const r = loanInterest / 12 / 100;
                  const n = loanTenure * 12;
                  const emi = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
                  const totalPayment = emi * n;
                  const totalInterest = totalPayment - loanAmount;

                  return (
                    <div className="calculator-results-box" style={{ background: 'var(--bg-body)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div className="result-main-emi" style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-gray)', fontWeight: 'bold' }}>Monthly Installment (EMI)</span>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--orange)', margin: '4px 0 0 0', fontWeight: '800' }}>₹ {emi.toLocaleString('en-IN')} /mo</h3>
                      </div>
                      <div className="result-breakdown-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-gray)' }}>Principal Amount:</span>
                          <strong style={{ color: 'var(--text-dark)' }}>₹ {loanAmount.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-gray)' }}>Interest Payable:</span>
                          <strong style={{ color: '#ef4444' }}>₹ {totalInterest.toLocaleString('en-IN')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-light)', fontSize: '0.88rem' }}>
                          <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>Total Cost of Loan:</span>
                          <strong style={{ color: '#10b981' }}>₹ {totalPayment.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'new-cars' ? (
          <div className="new-cars-container">
            <div className="tab-header">
              <h1>Upcoming & Newly Launched Cars (2026/2027)</h1>
              <p>Explore the hot launches and EV marvels setting foot in India. Register interest to get exclusive launch updates, specs, and price brackets.</p>
            </div>

            <div className="new-cars-grid">
              {[
                {
                  id: "tata-curvv",
                  name: "Tata Curvv EV",
                  launch: "August 2026",
                  estPrice: "₹ 18.00 Lakhs onwards",
                  specs: { range: "502 km", battery: "55 kWh", power: "148 bhp", drive: "FWD" },
                  img: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600"
                },
                {
                  id: "thar-roxx",
                  name: "Mahindra Thar Roxx (5-Door)",
                  launch: "October 2026",
                  estPrice: "₹ 16.50 Lakhs onwards",
                  specs: { engine: "2.2L mHawk Diesel", torque: "370 Nm", drive: "4x4 / 4x2", capacity: "5-Seater" },
                  img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"
                },
                {
                  id: "maruti-evx",
                  name: "Maruti Suzuki eVX",
                  launch: "January 2027",
                  estPrice: "₹ 22.00 Lakhs onwards",
                  specs: { range: "550 km", battery: "60 kWh", drive: "AWD Option", safety: "ADAS Level 2" },
                  img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"
                },
                {
                  id: "creta-ev",
                  name: "Hyundai Creta EV",
                  launch: "March 2027",
                  estPrice: "₹ 20.00 Lakhs onwards",
                  specs: { range: "450 km", battery: "45 kWh", motor: "PMS Motor", charging: "Fast DC" },
                  img: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600"
                }
              ].map(car => (
                <div key={car.id} className="new-car-card">
                  <div className="new-car-img-box">
                    <img src={car.img} alt={car.name} onError={handleImageError} />
                    <span className="launch-tag">Launch: {car.launch}</span>
                  </div>
                  <div className="new-car-details">
                    <h3>{car.name}</h3>
                    <div className="new-car-price">Estimated Price: <strong>{car.estPrice}</strong></div>

                    <div className="new-car-specs-box">
                      {Object.entries(car.specs).map(([k, v]) => (
                        <div key={k} className="new-car-spec-pill">
                          <span className="lbl">{k.toUpperCase()}</span>
                          <span className="val">{v}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => { setSelectedNewCar(car.name); setNewCarSuccess(false); setNewCarError(null); }}
                      className="register-interest-btn"
                    >
                      💡 Register Interest
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedNewCar && (
              <div className="auth-modal-overlay" onClick={() => setSelectedNewCar(null)}>
                <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="auth-modal-close" onClick={() => setSelectedNewCar(null)}>×</button>

                  <div className="auth-modal-header">
                    <h2>Register Interest</h2>
                    <p>Sign up to receive price alerts, specifications, and dealer booking slots for <strong>{selectedNewCar}</strong>.</p>
                  </div>

                  {newCarSuccess ? (
                    <div className="booking-success-box" style={{ padding: '16px 0', border: 'none', background: 'transparent' }}>
                      <div className="success-icon">🎉</div>
                      <h3>Interest Registered!</h3>
                      <p>We've successfully registered your interest. You'll receive VIP launch news and priority booking details on your registered email/phone.</p>
                      <button onClick={() => setSelectedNewCar(null)} className="auth-submit-btn" style={{ width: '100%' }}>
                        Close window
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleNewCarSubmit} className="booking-form-box">
                      {newCarError && <div className="booking-error-msg">⚠️ {newCarError}</div>}

                      <div className="booking-field-group">
                        <label htmlFor="lead-name">Full Name</label>
                        <input
                          type="text"
                          id="lead-name"
                          value={newCarForm.name}
                          onChange={(e) => setNewCarForm({ ...newCarForm, name: e.target.value })}
                          placeholder="Your name"
                          required
                        />
                      </div>

                      <div className="booking-field-group">
                        <label htmlFor="lead-phone">Phone Number</label>
                        <input
                          type="tel"
                          id="lead-phone"
                          value={newCarForm.phone}
                          onChange={(e) => setNewCarForm({ ...newCarForm, phone: e.target.value })}
                          placeholder="10 digit mobile"
                          required
                        />
                      </div>

                      <div className="booking-field-group">
                        <label htmlFor="lead-email">Email Address</label>
                        <input
                          type="email"
                          id="lead-email"
                          value={newCarForm.email}
                          onChange={(e) => setNewCarForm({ ...newCarForm, email: e.target.value })}
                          placeholder="name@example.com"
                          required
                        />
                      </div>

                      <div className="booking-field-group">
                        <label htmlFor="lead-city">Preferred City</label>
                        <input
                          type="text"
                          id="lead-city"
                          value={newCarForm.city}
                          onChange={(e) => setNewCarForm({ ...newCarForm, city: e.target.value })}
                          placeholder="e.g. Mumbai, Bangalore"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="booking-submit-btn"
                        disabled={isNewCarLoading}
                        style={{ marginTop: '8px' }}
                      >
                        {isNewCarLoading ? 'Registering...' : 'Get Launch Alerts'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : currentView === 'services' ? (
          <div className="services-container">
            <div className="tab-header">
              <h1>Car Services & Periodic Spa</h1>
              <p>Book premium periodic service, air conditioning repair, wheel balancing, or deep detailing. Free doorstep pick-up & drop-off included.</p>
            </div>

            <div className="services-grid">
              <div className="services-list-left">
                {[
                  {
                    id: "periodic-oil",
                    name: "Periodic Engine Oil Service",
                    price: "₹ 2,999",
                    desc: "Full synthetic engine oil replacement, oil filter check, air filter cleaning, coolant top-up, and 40-point inspection check.",
                    icon: "🛢️"
                  },
                  {
                    id: "car-detailing",
                    name: "Deep Detailing & Interior Spa",
                    price: "₹ 4,499",
                    desc: "Deep foam exterior wash, clay bar paint treatment, interior dry vacuuming, dashboard polish, leather seats care, and premium wax coating.",
                    icon: "✨"
                  },
                  {
                    id: "ac-repair",
                    name: "Periodic AC Service & Gas Topup",
                    price: "₹ 1,899",
                    desc: "AC filter cleaning, condenser washing, AC vent disinfection, dashboard duct cleaning, gas pressure leak testing, and refrigerant recharge.",
                    icon: "❄️"
                  },
                  {
                    id: "brake-inspection",
                    name: "Brake Pads Replacement & Inspection",
                    price: "₹ 1,499",
                    desc: "Front brake pad cleaning/replacement, caliper cleaning, disc rotor inspection, brake oil top-up, and response diagnostic calibration.",
                    icon: "🛑"
                  }
                ].map(service => (
                  <div
                    key={service.id}
                    className={`service-selection-card ${selectedService === service.name ? 'active' : ''}`}
                    onClick={() => { setSelectedService(service.name); setServiceSuccess(null); setServiceError(null); }}
                  >
                    <span className="service-icon">{service.icon}</span>
                    <div className="service-body">
                      <div className="service-header-row">
                        <h3>{service.name}</h3>
                        <strong>{service.price}</strong>
                      </div>
                      <p>{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="services-booking-right">
                {serviceSuccess ? (
                  <div className="booking-success-box" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div className="success-icon">📅</div>
                    <h3>Service Booked!</h3>
                    <p>Hi <strong>{serviceSuccess.name}</strong>, your periodic car service booking is verified.</p>
                    <div className="booking-receipt-details">
                      <div><strong>Service:</strong> {serviceSuccess.service_name}</div>
                      <div><strong>Date:</strong> {new Date(serviceSuccess.booking_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div><strong>Location:</strong> {serviceSuccess.city} (Doorstep pickup)</div>
                      <div><strong>Booking ID:</strong> CS-SRV-{serviceSuccess.id}</div>
                    </div>
                    <p className="success-subnote">Our service coordinator will coordinate vehicle pick-up. Contact number: <strong>{serviceSuccess.phone}</strong>.</p>
                    <button onClick={() => setServiceSuccess(null)} className="book-another-btn">
                      Book another service
                    </button>
                  </div>
                ) : (
                  <div className="booking-card">
                    <h2>Schedule Service Booking</h2>
                    {selectedService ? (
                      <p>You have selected: <strong>{selectedService}</strong>. Please complete the form below to lock your doorstep service.</p>
                    ) : (
                      <p>Please select a service from the left catalog panel to begin booking.</p>
                    )}

                    <form onSubmit={handleServiceSubmit} className="booking-form-box">
                      {serviceError && <div className="booking-error-msg">⚠️ {serviceError}</div>}

                      <div className="booking-field-group">
                        <label htmlFor="srv-name">Full Name</label>
                        <input
                          type="text"
                          id="srv-name"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                          placeholder="Your name"
                          disabled={!selectedService}
                          required
                        />
                      </div>

                      <div className="booking-field-group">
                        <label htmlFor="srv-phone">Phone Number</label>
                        <input
                          type="tel"
                          id="srv-phone"
                          value={serviceForm.phone}
                          onChange={(e) => setServiceForm({ ...serviceForm, phone: e.target.value })}
                          placeholder="Mobile number"
                          disabled={!selectedService}
                          required
                        />
                      </div>

                      <div className="booking-field-row">
                        <div className="booking-field-group" style={{ flex: 1 }}>
                          <label htmlFor="srv-city">City / Service Center</label>
                          <select
                            id="srv-city"
                            value={serviceForm.city}
                            onChange={(e) => setServiceForm({ ...serviceForm, city: e.target.value })}
                            disabled={!selectedService}
                          >
                            <option value="Delhi">Delhi</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Pune">Pune</option>
                            <option value="Kolkata">Kolkata</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Hyderabad">Hyderabad</option>
                          </select>
                        </div>
                        <div className="booking-field-group" style={{ flex: 1 }}>
                          <label htmlFor="srv-date">Appointment Date</label>
                          <input
                            type="date"
                            id="srv-date"
                            value={serviceForm.date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                            disabled={!selectedService}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="booking-submit-btn"
                        disabled={!selectedService || isServiceLoading}
                        style={{ marginTop: '6px' }}
                      >
                        {isServiceLoading ? 'Scheduling booking...' : 'Confirm Doorstep Service Appointment'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : currentView === 'sell-valuation' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <ValuationModal isPage={true} />
            </div>
            <SellSidebarInfo />
          </div>
        ) : currentView === 'sell-inspection' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <InspectionModal isPage={true} />
            </div>
            <SellSidebarInfo />
          </div>
        ) : currentView === 'sell-my-listings' ? (
          <div className="sell-car-container">
            <div className="tab-header">
              <h1>My Registered Listings</h1>
              <p>Track and manage the used cars you have listed for sale on CarSaathi.</p>
            </div>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
              {(() => {
                const myCars = allCars.filter((c: any) => Number(c.created_by) === Number(user?.id));
                if (myCars.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <p style={{ color: 'var(--text-gray)', fontSize: '1rem', margin: '0 0 16px 0' }}>You have not listed any cars yet.</p>
                      <button onClick={() => setCurrentView('sell')} className="sell-submit-btn" style={{ padding: '10px 20px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        List a Car Now
                      </button>
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {myCars.map((car: any) => (
                      <div key={car.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                          <img src={getCarImageUrl(car)} alt={car.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={handleImageError} />
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>{car.make} {car.model}</h3>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                            <span>{car.year}</span>
                            <span>•</span>
                            <span>{car.city}</span>
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--orange)', marginTop: 'auto' }}>
                            ₹ {car.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : currentView === 'sell-tracker' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <TrackerModal user={user} isPage={true} />
            </div>
            <SellSidebarInfo />
          </div>
        ) : currentView === 'sell-tips' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <TipsModal isPage={true} />
            </div>
            <SellSidebarInfo />
          </div>
        ) : currentView === 'loan-eligibility' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <EligibilityModal isPage={true} />
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'loan-compare' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <CompareModal isPage={true} />
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'loan-docs' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <DocsModal isPage={true} />
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'loan-faqs' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <FaqsModal isPage={true} />
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'loan-track' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <LoanTrackerModal user={user} isPage={true} />
            </div>
            <LoanSidebarInfo />
          </div>
        ) : currentView === 'new-launches' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <LaunchesModal isPage={true} />
            </div>
            <NewSidebarInfo />
          </div>
        ) : currentView === 'new-compare' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <CompareNewModal isPage={true} />
            </div>
            <NewSidebarInfo />
          </div>
        ) : currentView === 'new-test-drive' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <BookTestDriveModal isPage={true} />
            </div>
            <NewSidebarInfo />
          </div>
        ) : currentView === 'new-brochure' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <BrochureModal onToast={triggerToast} isPage={true} />
            </div>
            <NewSidebarInfo />
          </div>
        ) : currentView === 'new-offers' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <OffersModal isPage={true} />
            </div>
            <NewSidebarInfo />
          </div>
        ) : currentView === 'services-wash' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <WashModal isPage={true} />
            </div>
            <ServicesSidebarInfo />
          </div>
        ) : currentView === 'services-insurance' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <InsuranceModal onToast={triggerToast} isPage={true} />
            </div>
            <ServicesSidebarInfo />
          </div>
        ) : currentView === 'services-inspection' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <InspectionModal isPage={true} />
            </div>
            <ServicesSidebarInfo />
          </div>
        ) : currentView === 'services-rsa' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <RsaModal isPage={true} />
            </div>
            <ServicesSidebarInfo />
          </div>
        ) : currentView === 'services-history' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <HistoryModal isPage={true} />
            </div>
            <ServicesSidebarInfo />
          </div>
        ) : currentView === 'services-centers' ? (
          <div className="sub-option-split-container">
            <div className="sub-option-main-card">
              <CentersModal isPage={true} />
            </div>
            <ServicesSidebarInfo />
          </div>
        ) : selectedCarId !== null ? (
          <div className="car-details-container">
            {/* Back to search results bar */}
            <div className="details-back-bar" onClick={() => setSelectedCarId(null)}>
              <span>← Back to search results</span>
            </div>

            {selectedCar ? (
              <>
                <div className="car-details-grid">
                {/* Left side details */}
                <div className="car-details-left">
                  <div className="details-header-mobile">
                    <span className="certified-badge">CarSaathi Certified</span>
                    <h1>{selectedCar.year} {selectedCar.make} {selectedCar.model}</h1>
                    <div className="details-location" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {selectedCar.city}, India
                    </div>
                  </div>

                  {/* Main large image */}
                  <div className="details-image-wrapper" onClick={() => {
                    setShowLightbox(true);
                    setZoomScale(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}>
                    <img
                      src={getCarImageUrl(selectedCar)}
                      alt={`${selectedCar.make} ${selectedCar.model}`}
                      className="details-main-img"
                      onError={handleImageError}
                    />
                    <div className="certified-corner-badge">Certified and Checked</div>
                  </div>

                  {/* Mobile-only Price card */}
                  <div className="details-price-card mobile-only-price" style={{ marginTop: '16px' }}>
                    <div className="price-label">Ex-Showroom Price</div>
                    <div className="price-strike">
                      {region === 'IN' ? formatINR(selectedCar.price * 1.08) : formatGBP(selectedCar.price * 1.08 / 100)}
                    </div>
                    <div className="price-bold">
                      {region === 'IN' ? formatINR(selectedCar.price) : formatGBP(selectedCar.price / 100)}
                      <span className="price-discount-badge">Save 8%!</span>
                    </div>

                    <div className="price-emi-note">
                      Estimated EMI starts from <strong>₹{Math.round(selectedCar.price / 68).toLocaleString('en-IN')}/month</strong>
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(selectedCar.id, e)}
                      className={`details-wishlist-btn ${wishlist.includes(selectedCar.id) ? 'active' : ''}`}
                    >
                      {wishlist.includes(selectedCar.id) ? '❤️ In Wishlist' : '♡ Add to Wishlist'}
                    </button>
                  </div>

                  {/* Specs summary block */}
                  <h2 className="section-title">Key Specifications</h2>
                  <div className="details-specs-grid">
                    <div className="spec-card">
                      <div className="spec-icon">📅</div>
                      <div className="spec-label">Year of Manufacture</div>
                      <div className="spec-value">{selectedCar.year}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-icon">🛣️</div>
                      <div className="spec-label">Kilometers Driven</div>
                      <div className="spec-value">
                        {selectedCar.kms_driven !== undefined && selectedCar.kms_driven !== null
                          ? selectedCar.kms_driven.toLocaleString()
                          : (() => {
                              const carHash = typeof selectedCar.id === 'string' ? parseInt(selectedCar.id.slice(-4), 16) || 0 : selectedCar.id || 0;
                              return Math.round((2026 - selectedCar.year) * 11000 + (carHash * 850) % 12000).toLocaleString();
                            })()
                        } km
                      </div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-icon">⛽</div>
                      <div className="spec-label">Fuel Type</div>
                      <div className="spec-value">{getCarFuelType(selectedCar)}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-icon">⚙️</div>
                      <div className="spec-label">Transmission</div>
                      <div className="spec-value">{getCarTransmission(selectedCar)}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-icon">👤</div>
                      <div className="spec-label">No. of Owners</div>
                      <div className="spec-value">{selectedCar.owners || '1st Owner'}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-icon">📍</div>
                      <div className="spec-label">Registration RTO</div>
                      <div className="spec-value">{selectedCar.rto || getStateCode(selectedCar.city)}</div>
                    </div>
                  </div>

                  {/* Features list */}
                  <h2 className="section-title">Premium Features included</h2>
                  <div className="features-check-grid">
                    <div className="feature-item-checked">✓ Anti-Lock Braking System (ABS)</div>
                    <div className="feature-item-checked">✓ Dual Front Airbags (Driver & Passenger)</div>
                    <div className="feature-item-checked">✓ Fully Automatic Climate Control</div>
                    <div className="feature-item-checked">✓ Reverse Parking Camera with Sensors</div>
                    <div className="feature-item-checked">✓ Steering Mounted Audio Controls</div>
                    <div className="feature-item-checked">✓ Touchscreen SmartPlay Infotainment System</div>
                    <div className="feature-item-checked">✓ Keyless Smart Entry with Push Start/Stop Button</div>
                    <div className="feature-item-checked">✓ Electrically Adjustable & Foldable ORVMs</div>
                  </div>

                  {/* Certified checklist card */}
                  <div className="details-guarantee-card">
                    <div className="guarantee-icon">🛡️</div>
                    <div className="guarantee-info">
                      <h3>CarSaathi Assured Guarantee</h3>
                      <p>Every pre-owned vehicle on CarSaathi undergoes a stringent 140-point quality check testing engine compression, brakes, electronics, suspension, and steering. Includes 1-year comprehensive engine & gearbox warranty and 7-day money-back assurance.</p>
                    </div>
                  </div>
                </div>

                {/* Right side checkout sidebar */}
                <div className="car-details-right">
                  <div className="details-header-desktop">
                    <span className="certified-badge">CarSaathi Certified</span>
                    <h1>{selectedCar.year} {selectedCar.make} {selectedCar.model}</h1>
                    <div className="details-location" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {selectedCar.city}, India
                    </div>
                    {user && token && (user.role === 'Admin' || (user.role === 'Dealer' && (selectedCar.created_by === null || Number(user.id) === Number(selectedCar.created_by)))) && (
                      <button
                        className="details-edit-btn"
                        onClick={() => openEditModal(selectedCar)}
                        style={{
                          marginTop: '10px',
                          background: 'linear-gradient(135deg, #8570f5, #ff6f54)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(133, 112, 245, 0.4)'
                        }}
                      >
                        ✏️ Edit Car Listing
                      </button>
                    )}
                  </div>

                  <div className="details-price-card desktop-only-price">
                    <div className="price-label">Ex-Showroom Price</div>
                    <div className="price-strike">
                      {region === 'IN' ? formatINR(selectedCar.price * 1.08) : formatGBP(selectedCar.price * 1.08 / 100)}
                    </div>
                    <div className="price-bold">
                      {region === 'IN' ? formatINR(selectedCar.price) : formatGBP(selectedCar.price / 100)}
                      <span className="price-discount-badge">Save 8%!</span>
                    </div>

                    <div className="price-emi-note">
                      Estimated EMI starts from <strong>₹{Math.round(selectedCar.price / 68).toLocaleString('en-IN')}/month</strong>
                    </div>

                    <button
                      onClick={(e) => toggleWishlist(selectedCar.id, e)}
                      className={`details-wishlist-btn ${wishlist.includes(selectedCar.id) ? 'active' : ''}`}
                    >
                      {wishlist.includes(selectedCar.id) ? '❤️ In Wishlist' : '♡ Add to Wishlist'}
                    </button>
                  </div>

                  {/* Test Drive booking card */}
                  <div className="booking-card">
                    <h2>Book a Free Test Drive</h2>
                    <p>Schedule a free test drive at your convenience. Our executive will deliver the car to your doorstep or meet you at the hub.</p>

                    {bookingSuccess ? (
                      <div className="booking-success-box">
                        <div className="success-icon">🎉</div>
                        <h3>Test Drive Confirmed!</h3>
                        <p>Hi <strong>{bookingSuccess.name}</strong>, your test drive slot has been reserved.</p>
                        <div className="booking-receipt-details">
                          <div><strong>Car:</strong> {selectedCar.year} {selectedCar.make} {selectedCar.model}</div>
                          <div><strong>Date:</strong> {new Date(bookingSuccess.booking_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                          <div><strong>Slot:</strong> {bookingSuccess.booking_time}</div>
                          <div><strong>Booking ID:</strong> CS-TD-{bookingSuccess.id}</div>
                        </div>
                        <p className="success-subnote">Our test drive specialist will call you shortly on <strong>{bookingSuccess.phone}</strong> to confirm the exact location.</p>
                        <button onClick={() => setBookingSuccess(null)} className="book-another-btn">
                          Change / Book another slot
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleBookingSubmit} className="booking-form-box">
                        {bookingError && <div className="booking-error-msg">⚠️ {bookingError}</div>}

                        <div className="booking-field-group">
                          <label htmlFor="booking-name">Full Name</label>
                          <input
                            type="text"
                            id="booking-name"
                            value={bookingForm.name}
                            onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>

                        <div className="booking-field-group">
                          <label htmlFor="booking-phone">Phone Number</label>
                          <input
                            type="tel"
                            id="booking-phone"
                            value={bookingForm.phone}
                            onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                            placeholder="Enter 10-digit mobile number"
                            required
                          />
                        </div>

                        <div className="booking-field-row">
                          <div className="booking-field-group" style={{ flex: 1 }}>
                            <label htmlFor="booking-date">Preferred Date</label>
                            <input
                              type="date"
                              id="booking-date"
                              value={bookingForm.date}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                              required
                            />
                          </div>

                          <div className="booking-field-group" style={{ flex: 1 }}>
                            <label htmlFor="booking-time">Time Slot</label>
                            <select
                              id="booking-time"
                              value={bookingForm.time}
                              onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                              required
                            >
                              <option value="">Select Time Slot</option>
                              <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                              <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                              <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                              <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="booking-submit-btn"
                          disabled={isBookingLoading}
                        >
                          {isBookingLoading ? 'Processing Booking...' : 'Schedule Doorstep Test Drive'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
              <SimilarCarsSection carId={selectedCar.id} onSelectCar={(id) => setSelectedCarId(id)} />
              </>
            ) : (
              <div className="details-loading-box">
                <div className="details-spinner"></div>
                <h3>Loading Certified Details...</h3>
                <p>Pulling condition report, specs and test logs from CarSaathi backend database.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Left Filter Sidebar Column */}
            <div className="sidebar-column">
              {/* Separate Rounded Box for All / Luxe Options */}
              <div className="tab-switcher-box">
                <div className="tab-switcher">
                  <button
                    className={`tab-btn ${tabSelected === 'all' ? 'active' : ''}`}
                    onClick={() => setTabSelected('all')}
                  >
                    All
                  </button>
                  <button
                    className={`tab-btn ${tabSelected === 'luxe' ? 'active' : ''}`}
                    onClick={() => setTabSelected('luxe')}
                  >
                    💎 Luxe
                  </button>
                </div>
              </div>

              <aside className={`sidebar ${showMobileFilters ? 'mobile-open' : ''}`}>
                {/* Mobile Filter close header */}
                <div className="mobile-filter-header">
                  <span className="mobile-filter-title">⚙️ Filters & Sorting</span>
                  <button
                    className="mobile-filter-close-btn"
                    onClick={() => setShowMobileFilters(false)}
                    aria-label="Close filters"
                  >
                    &times; Apply
                  </button>
                </div>

              {/* Budget Text Search Parser */}
              <div className="filter-section">
                <span className="filter-title">Budget</span>
                <div className="sidebar-search-wrapper">
                  <span className="sidebar-search-icon">💰</span>
                  <input
                    type="text"
                    placeholder="Search budget (e.g. under 5 lakh, 8L)"
                    value={priceQuery}
                    onChange={(e) => setPriceQuery(e.target.value)}
                    className="sidebar-search-input"
                    style={apiError ? { borderColor: '#ef4444' } : {}}
                  />
                </div>
                {apiError && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '-4px' }}>
                    {apiError}
                  </span>
                )}
                <div className="slider-limits">
                  <span>₹ 0</span>
                  <span>₹ {maxPriceFilter.toLocaleString('en-IN')}</span>
                </div>
                <div className="slider-labels">
                  <span>Minimum</span>
                  <span>Maximum</span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="range"
                    min="0"
                    max="50000000"
                    step="100000"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#1e3a8a' }}
                  />
                </div>
              </div>

              {/* AI Recommendation Quick Action */}
              <div
                className="ai-recommendation-cta"
                onClick={() => { setCurrentView('ai-recommend'); setSelectedCarId(null); }}
                style={{
                  background: 'linear-gradient(135deg, rgba(133, 112, 245, 0.1), rgba(255, 111, 84, 0.1))',
                  border: '1px dashed var(--brand)',
                  borderRadius: 'var(--radius-input)',
                  padding: '16px',
                  margin: '20px 0',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✨</div>
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-dark)', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  Ask AI Car Assistant
                </h4>
                <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  Get personalized recommendations matching your lifestyle & budget.
                </p>
              </div>

              {/* Make & Model Search Input */}
              <div className="filter-section">
                <span className="filter-title">Make & Model</span>
                <div className="sidebar-search-wrapper">
                  <span className="sidebar-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search make or model..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="sidebar-search-input"
                  />
                </div>



                {/* Quick popular pills */}
                <div className="quick-brands-grid">
                  {QUICK_BRAND_PILLS.map(model => (
                    <button
                      key={model}
                      onClick={() => setLocalSearchTerm(localSearchTerm === model ? '' : model)}
                      className={`quick-brand-pill ${localSearchTerm === model ? 'active' : ''}`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Brands checkboxes */}
              <div className="filter-section">
                <span className="filter-title">Popular Brands</span>
                <div className="checkbox-list">
                  {POPULAR_BRANDS.map(brand => {
                    const count = allCars.filter(c => c.make === brand).length;
                    return (
                      <label key={brand} className="checkbox-item">
                        <div className="checkbox-left">
                          <input
                            type="checkbox"
                            checked={selectedMakes.includes(brand)}
                            onChange={() => handleMakeToggle(brand)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{brand}</span>
                        </div>
                        <span className="checkbox-count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Fuel Type Filter */}
              <div className="filter-section">
                <span className="filter-title">Fuel Type</span>
                <div className="checkbox-list">
                  {['Petrol', 'Diesel', 'Electric'].map(fuel => {
                    const count = allCars.filter((c: any) => getCarFuelType(c) === fuel).length;
                    return (
                      <label key={fuel} className="checkbox-item">
                        <div className="checkbox-left">
                          <input
                            type="checkbox"
                            checked={selectedFuels.includes(fuel)}
                            onChange={() => {
                              if (selectedFuels.includes(fuel)) {
                                setSelectedFuels(selectedFuels.filter(f => f !== fuel));
                              } else {
                                setSelectedFuels([...selectedFuels, fuel]);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{fuel}</span>
                        </div>
                        <span className="checkbox-count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Transmission Filter */}
              <div className="filter-section">
                <span className="filter-title">Transmission</span>
                <div className="checkbox-list">
                  {['Automatic', 'Manual'].map(trans => {
                    const count = allCars.filter((c: any) => getCarTransmission(c) === trans).length;
                    return (
                      <label key={trans} className="checkbox-item">
                        <div className="checkbox-left">
                          <input
                            type="checkbox"
                            checked={selectedTransmissions.includes(trans)}
                            onChange={() => {
                              if (selectedTransmissions.includes(trans)) {
                                setSelectedTransmissions(selectedTransmissions.filter(t => t !== trans));
                              } else {
                                setSelectedTransmissions([...selectedTransmissions, trans]);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{trans}</span>
                        </div>
                        <span className="checkbox-count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Car Age Filter */}
              <div className="filter-section">
                <span className="filter-title">Car Age</span>
                <div className="checkbox-list">
                  {[
                    { label: 'Any Age', value: 'all' },
                    { label: 'Under 3 Years', value: 'under3' },
                    { label: 'Under 5 Years', value: 'under5' },
                    { label: 'Under 8 Years', value: 'under8' }
                  ].map(age => (
                    <label key={age.value} className="checkbox-item">
                      <div className="checkbox-left">
                        <input
                          type="radio"
                          name="car-age"
                          checked={selectedAge === age.value}
                          onChange={() => setSelectedAge(age.value)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{age.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kilometers Driven Filter */}
              <div className="filter-section">
                <span className="filter-title">Kilometers Driven</span>
                <div className="checkbox-list">
                  {[
                    { label: 'Any km', value: 'all' },
                    { label: 'Under 30,000 km', value: 'under30k' },
                    { label: 'Under 50,000 km', value: 'under50k' },
                    { label: 'Under 80,000 km', value: 'under80k' }
                  ].map(kmOpt => (
                    <label key={kmOpt.value} className="checkbox-item">
                      <div className="checkbox-left">
                        <input
                          type="radio"
                          name="car-km"
                          checked={selectedKms === kmOpt.value}
                          onChange={() => setSelectedKms(kmOpt.value)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{kmOpt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exterior Colour Filter */}
              <div className="filter-section">
                <span className="filter-title">Colour</span>
                <div className="checkbox-list">
                  {['White', 'Silver', 'Grey', 'Red', 'Blue', 'Black'].map(color => {
                    const count = allCars.filter((c: any) => getCarColor(c) === color).length;
                    return (
                      <label key={color} className="checkbox-item">
                        <div className="checkbox-left">
                          <input
                            type="checkbox"
                            checked={selectedColors.includes(color)}
                            onChange={() => {
                              if (selectedColors.includes(color)) {
                                setSelectedColors(selectedColors.filter(c => c !== color));
                              } else {
                                setSelectedColors([...selectedColors, color]);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{color}</span>
                        </div>
                        <span className="checkbox-count">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </aside>
            </div>

            {/* Right Main Car Grid Area */}
            <main className="main-panel">
              <div className="listings-meta">
                {showWishlistOnly ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 111, 84, 0.08)', border: '1px solid rgba(255, 111, 84, 0.2)', padding: '10px 20px', borderRadius: '8px', marginBottom: '15px' }}>
                    <span style={{ color: 'var(--orange)', fontWeight: 'bold' }}>❤️ Showing your wishlisted cars ({filteredCars.length})</span>
                    <button
                      onClick={() => setShowWishlistOnly(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
                    >
                      Show All Cars
                    </button>
                  </div>
                ) : showMyListingsOnly ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 20px', borderRadius: '8px', marginBottom: '15px' }}>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>💼 Showing your active listings ({filteredCars.length})</span>
                    <button
                      onClick={() => setShowMyListingsOnly(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
                    >
                      Show All Listings
                    </button>
                  </div>
                ) : (
                  <>Explore <strong>{filteredCars.length} used cars</strong> in {selectedCity === 'all' ? 'India' : selectedCity}. Find verified sedans, SUVs, and hatchbacks matching your budget constraints.</>
                )}
              </div>

              {/* Sorting, Currency switch and Stats stats-bar */}
              <div className="listings-toolbar">
                <div className="toolbar-stats">
                  <span className="toolbar-stat-item">
                    Avg Price: <strong>{renderFormattedPrice(avgPrice)}</strong>
                  </span>
                  <span className="toolbar-stat-item">
                    Inventory: <strong>{cars.length} Cars</strong>
                  </span>
                </div>

                <div className="toolbar-actions">
                  {/* Sort by dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="toolbar-select"
                  >
                    {searchTerm.trim() && (
                      <option value="relevance">🎯 Relevance</option>
                    )}
                    <option value="year_desc">📅 Newest First</option>
                    <option value="price_asc">💵 Price: Low to High</option>
                    <option value="price_desc">💵 Price: High to Low</option>
                    <option value="make_asc">🔤 Make: A-Z</option>
                  </select>

                  {/* Currency Toggle */}
                  <button
                    onClick={() => setRegion(region === 'IN' ? 'UK' : 'IN')}
                    className={`currency-toggle-btn ${region === 'IN' ? 'active' : ''}`}
                  >
                    {region === 'IN' ? '🇮🇳 INR (₹)' : '🇬🇧 GBP (£)'}
                  </button>

                  {/* Price Format Toggle */}
                  <button
                    onClick={() => setPriceFormat(priceFormat === 'lakh' ? 'full' : 'lakh')}
                    className={`currency-toggle-btn price-format-btn ${priceFormat === 'lakh' ? 'active' : ''}`}
                    title="Toggle between Lakh/Crore compact price format and full numeric format"
                  >
                    {priceFormat === 'lakh' ? '🏷️ Price: Lakh/Cr' : '🏷️ Price: Full ₹'}
                  </button>
                </div>
              </div>

              {/* Cars Grid */}
              <div className="cars-listings-grid">
                {isLoading ? (
                  <div className="no-listings" style={{ gridColumn: '1 / -1' }}>
                    <h3>Loading Listings...</h3>
                    <p>Fetching certified preowned cars from CarSaathi database.</p>
                  </div>
                ) : sortedCars.length > 0 ? (
                  sortedCars.map(car => {
                    const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
                    const mileage = car.kms_driven !== undefined && car.kms_driven !== null
                      ? car.kms_driven
                      : Math.round((2026 - car.year) * 11000 + (carHash * 850) % 12000);
                    const fuelType = getCarFuelType(car);
                    const transmission = getCarTransmission(car);
                    const color = getCarColor(car);
                    const stateCode = getStateCode(car.city);
                    const emi = Math.round(car.price / 68);

                    return (
                      <div key={car.id} className="car-card-cars24" onClick={() => setSelectedCarId(car.id)} style={{ cursor: 'pointer' }}>
                        {/* Image Area */}
                        <div className="card-image-box">
                          {user && token && (user.role === 'Admin' || (user.role === 'Dealer' && (car.created_by === null || Number(user.id) === Number(car.created_by)))) && (
                            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
                              <button
                                className="card-edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(car);
                                }}
                                style={{
                                  background: '#8570f5',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                title="Edit Listing"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="card-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCar(car.id);
                                }}
                                style={{
                                  background: '#ef4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                title="Delete Listing"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                          {car.similarity_score !== undefined && car.similarity_score !== null && (
                            <span className="semantic-match-badge" style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              backgroundColor: 'rgba(133, 112, 245, 0.9)',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              zIndex: 10,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                              backdropFilter: 'blur(2px)'
                            }}>
                              ✨ {Math.round(car.similarity_score * 100)}% Semantic Match
                            </span>
                          )}
                          <img
                            src={getCarImageUrl(car)}
                            alt={`${car.make} ${car.model}`}
                            className="car-card-img"
                            onError={handleImageError}
                          />
                          <span
                            className="card-heart-btn"
                            onClick={(e) => toggleWishlist(car.id, e)}
                            style={{ color: wishlist.includes(car.id) ? '#ff5c3c' : '#6f7287' }}
                          >
                            {wishlist.includes(car.id) ? '❤️' : '♡'}
                          </span>
                          <div className="owned-stock-badge">CarSaathi Certified</div>
                        </div>

                        {/* Content Details */}
                        <div className="card-details-box">
                          {/* EMI / Price section */}
                          <div className="emi-price-block">
                            <div className="emi-value">
                              EMI ₹{emi.toLocaleString('en-IN')}/m*
                              <span>+ other charges</span>
                            </div>
                            <div className="price-details">
                              <span className="original-price-struck" title={region === 'IN' ? formatINR(car.price * 1.08) : formatGBP(car.price * 1.08 / 100)}>
                                {region === 'IN' 
                                  ? (priceFormat === 'full' ? formatINR(car.price * 1.08) : `₹${((car.price * 1.08) / 100000).toFixed(2)}L`) 
                                  : `£${Math.round(car.price * 1.08 / 100).toLocaleString()}`}
                              </span>
                              <span className="final-price-bold" title={region === 'IN' ? formatINR(car.price) : formatGBP(car.price / 100)}>
                                {region === 'IN' 
                                  ? (priceFormat === 'full' ? formatINR(car.price) : `₹${(car.price / 100000).toFixed(2)}L`) 
                                  : `£${Math.round(car.price / 100).toLocaleString()}`}
                              </span>
                              <span className="charges-subtext" style={{ visibility: (region === 'IN' && priceFormat !== 'full') ? 'visible' : 'hidden' }}>
                                Lakh
                              </span>
                            </div>
                          </div>

                          <h3 className="card-title-line">
                            {car.year} {car.make} {car.model}
                            <span className="card-title-trim"> {carHash % 2 === 0 ? 'SIGMA PETROL 1.2' : 'VXI'}</span>
                          </h3>

                          {/* Meta pills */}
                          <div className="card-meta-pills">
                            <span className="meta-pill">{mileage.toLocaleString()} km</span>
                            <span className="meta-pill">{fuelType}</span>
                            <span className="meta-pill">{transmission}</span>
                            <span className="meta-pill">{color}</span>
                            <span className="meta-pill">{stateCode}</span>
                          </div>
                        </div>

                        {/* Footer City */}
                        <div className="card-footer-location">
                          {car.city} India
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-listings">
                    <h3>{showWishlistOnly ? 'Your Wishlist is Empty' : 'No Listings Found'}</h3>
                    <p>{showWishlistOnly
                      ? 'Add vehicles to your wishlist by clicking the heart button on listing cards.'
                      : apiError ? apiError : 'No vehicles match your active filters. Try resetting search criteria.'}
                    </p>
                    {showWishlistOnly && (
                      <button
                        onClick={() => setShowWishlistOnly(false)}
                        className="view-listings-btn"
                        style={{ marginTop: '15px', padding: '8px 16px', background: 'var(--orange)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Browse All Cars
                      </button>
                    )}
                  </div>
                )}
              </div>
            </main>

            {/* Floating Filter Button on Mobile */}
            <button
              className="mobile-floating-filter-btn"
              onClick={() => setShowMobileFilters(true)}
              aria-label="Open filter settings"
            >
              ⚙️ Filter & Sort
            </button>
          </>
        )}
      </div>

      {/* Company Footer */}
      <CompanyFooter
        setCurrentView={setCurrentView}
        setSelectedCity={setSelectedCity}
        setSelectedCarId={setSelectedCarId}
        triggerToast={triggerToast}
        handleResetToMainListing={handleResetToMainListing}
        setShowWishlistOnly={setShowWishlistOnly}
      />

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(token, user) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            const userTheme = localStorage.getItem(`theme_user_${user.id}`);
            if (userTheme === 'dark' || userTheme === 'light') {
              setTheme(userTheme);
            } else {
              setTheme('light');
            }
          }}
        />
      )}

      {/* Callback Modal Overlay */}
      {showCallbackModal && (
        <CallbackModal onClose={() => setShowCallbackModal(false)} />
      )}

      {/* Lightbox / Zoom Modal */}
      {showLightbox && selectedCar && (
        <div className="lightbox-overlay" onClick={handleContainerClick}>
          <div className="lightbox-header">
            <button className="lightbox-btn close-btn" onClick={() => setShowLightbox(false)} title="Close (Esc)">
              &times;
            </button>
          </div>

          <div
            className={`lightbox-container ${isDragging ? 'grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleContainerClick}
          >
            <div
              className="lightbox-img-wrapper"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`
              }}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={getCarImageUrl(selectedCar)}
                alt={`${selectedCar.make} ${selectedCar.model}`}
                onError={handleImageError}
              />
            </div>
          </div>

          <div className="lightbox-controls">
            <button className="lightbox-btn" onClick={handleZoomOut} title="Zoom Out" disabled={zoomScale <= 1}>
              ➖
            </button>
            <span className="lightbox-zoom-info">{Math.round(zoomScale * 100)}%</span>
            <button className="lightbox-btn" onClick={handleZoomIn} title="Zoom In" disabled={zoomScale >= 4}>
              ➕
            </button>
            <button className="lightbox-btn" onClick={handleZoomReset} title="Reset Zoom">
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Edit Car Modal Overlay */}
      {isEditModalOpen && editingCar && (
        <div className="auth-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="auth-modal-content edit-car-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button className="auth-modal-close" onClick={() => setIsEditModalOpen(false)}>
              &times;
            </button>

            <div className="auth-modal-header" style={{ marginBottom: '10px' }}>
              <h2>✏️ Edit Car Listing</h2>
              <p className="auth-modal-subtitle">Update specs, pricing, location, and images for this listing.</p>
            </div>

            {editError && (
              <div className="booking-error-msg" style={{ marginBottom: '15px' }}>
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleEditCarSubmit} className="sell-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="sell-field-group">
                <label>Car Make *</label>
                <input
                  type="text"
                  value={editForm.make}
                  onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                  placeholder="e.g. Maruti Suzuki, Hyundai, BMW"
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>Car Model *</label>
                <input
                  type="text"
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  placeholder="e.g. Swift, Creta, X5"
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>Year of Manufacture *</label>
                <input
                  type="number"
                  value={editForm.year}
                  min={1900}
                  max={2027}
                  onChange={(e) => setEditForm({ ...editForm, year: parseInt(e.target.value, 10) || 2022 })}
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>Price (₹ INR) *</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="e.g. 750000"
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>City *</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="e.g. Delhi, Mumbai, Pune"
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>Registration RTO *</label>
                <input
                  type="text"
                  value={editForm.rto}
                  onChange={(e) => setEditForm({ ...editForm, rto: e.target.value })}
                  placeholder="e.g. DL01, MH02, KA05"
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>Fuel Type *</label>
                <select
                  value={editForm.fuel_type}
                  onChange={(e) => setEditForm({ ...editForm, fuel_type: e.target.value })}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="sell-field-group">
                <label>Transmission *</label>
                <select
                  value={editForm.transmission}
                  onChange={(e) => setEditForm({ ...editForm, transmission: e.target.value })}
                >
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              <div className="sell-field-group">
                <label>Kilometers Driven *</label>
                <input
                  type="number"
                  value={editForm.kms_driven}
                  onChange={(e) => setEditForm({ ...editForm, kms_driven: e.target.value })}
                  placeholder="e.g. 25000"
                  required
                />
              </div>

              <div className="sell-field-group">
                <label>No. of Owners *</label>
                <select
                  value={editForm.owners}
                  onChange={(e) => setEditForm({ ...editForm, owners: e.target.value })}
                >
                  <option value="1st Owner">1st Owner</option>
                  <option value="2nd Owner">2nd Owner</option>
                  <option value="3rd Owner">3rd Owner</option>
                  <option value="4th+ Owner">4th+ Owner</option>
                </select>
              </div>

              <div className="sell-field-group" style={{ gridColumn: '1 / -1' }}>
                <label>Car Image URL</label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/car-photo.jpg (leave empty for default)"
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={isEditLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--brand), var(--orange))',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {isEditLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}