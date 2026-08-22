import React from 'react';
import type { NewCarFormData, ViewType } from '../../types';
import { handleImageError } from '../../utils/carImages';
import LaunchesModal from '../modals/LaunchesModal';
import CompareNewModal from '../modals/CompareNewModal';
import BookTestDriveModal from '../modals/BookTestDriveModal';
import BrochureModal from '../modals/BrochureModal';
import OffersModal from '../modals/OffersModal';
import NewSidebarInfo from '../sidebars/NewSidebarInfo';

interface NewCarsViewProps {
  currentView: ViewType;
  selectedNewCar: string | null;
  setSelectedNewCar: (car: string | null) => void;
  newCarForm: NewCarFormData;
  setNewCarForm: React.Dispatch<React.SetStateAction<NewCarFormData>>;
  newCarSuccess: boolean;
  setNewCarSuccess: (success: boolean) => void;
  newCarError: string | null;
  setNewCarError: (err: string | null) => void;
  isNewCarLoading: boolean;
  onNewCarSubmit: (e: React.FormEvent) => void;
}

export const NewCarsView: React.FC<NewCarsViewProps> = ({
  currentView,
  selectedNewCar,
  setSelectedNewCar,
  newCarForm,
  setNewCarForm,
  newCarSuccess,
  newCarError,
  setNewCarError,
  isNewCarLoading,
  onNewCarSubmit
}) => {
  if (currentView === 'new-launches') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <LaunchesModal isPage={true} />
        </div>
        <NewSidebarInfo />
      </div>
    );
  }

  if (currentView === 'new-compare') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <CompareNewModal isPage={true} />
        </div>
        <NewSidebarInfo />
      </div>
    );
  }

  if (currentView === 'new-test-drive') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <BookTestDriveModal isPage={true} />
        </div>
        <NewSidebarInfo />
      </div>
    );
  }

  if (currentView === 'new-brochure') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <BrochureModal isPage={true} />
        </div>
        <NewSidebarInfo />
      </div>
    );
  }

  if (currentView === 'new-offers') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <OffersModal isPage={true} />
        </div>
        <NewSidebarInfo />
      </div>
    );
  }

  return (
    <div className="new-cars-container">
      <div className="tab-header">
        <h1>Upcoming & Newly Launched Cars (2026/2027)</h1>
        <p>Explore the hot launches and EV marvels setting foot in India. Register interest to get exclusive launch updates, specs, and price brackets.</p>
      </div>

      <div className="new-cars-grid">
        {[
          {
            id: 'tata-curvv',
            name: 'Tata Curvv EV',
            launch: 'August 2026',
            estPrice: '₹ 18.00 Lakhs onwards',
            specs: { range: '502 km', battery: '55 kWh', power: '148 bhp', drive: 'FWD' },
            img: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'
          },
          {
            id: 'thar-roxx',
            name: 'Mahindra Thar Roxx (5-Door)',
            launch: 'October 2026',
            estPrice: '₹ 16.50 Lakhs onwards',
            specs: { engine: '2.2L mHawk Diesel', torque: '370 Nm', drive: '4x4 / 4x2', capacity: '5-Seater' },
            img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600'
          },
          {
            id: 'maruti-evx',
            name: 'Maruti Suzuki eVX',
            launch: 'January 2027',
            estPrice: '₹ 22.00 Lakhs onwards',
            specs: { range: '550 km', battery: '60 kWh', drive: 'AWD Option', safety: 'ADAS Level 2' },
            img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
          },
          {
            id: 'creta-ev',
            name: 'Hyundai Creta EV',
            launch: 'March 2027',
            estPrice: '₹ 20.00 Lakhs onwards',
            specs: { range: '450 km', battery: '45 kWh', motor: 'PMS Motor', charging: 'Fast DC' },
            img: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600'
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
                onClick={() => { setSelectedNewCar(car.name); setNewCarError(null); }}
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
            <button className="auth-modal-close" onClick={() => setSelectedNewCar(null)} aria-label="Close modal">×</button>

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
              <form onSubmit={onNewCarSubmit} className="booking-form-box">
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
  );
};

export default NewCarsView;
