import React from 'react';
import type { Car, SellFormData, ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getCarImageUrl, handleImageError } from '../../utils/carImages';
import ValuationModal from '../modals/ValuationModal';
import InspectionModal from '../modals/InspectionModal';
import TrackerModal from '../modals/TrackerModal';
import TipsModal from '../modals/TipsModal';
import SellSidebarInfo from '../sidebars/SellSidebarInfo';

interface SellCarViewProps {
  currentView: ViewType;
  sellForm: SellFormData;
  setSellForm: React.Dispatch<React.SetStateAction<SellFormData>>;
  sellSuccess: boolean;
  setSellSuccess: (success: boolean) => void;
  sellError: string | null;
  isSellLoading: boolean;
  onSellSubmit: (e: React.FormEvent) => void;
  allCars: Car[];
  setCurrentView: (view: ViewType) => void;
}

export const SellCarView: React.FC<SellCarViewProps> = ({
  currentView,
  sellForm,
  setSellForm,
  sellSuccess,
  setSellSuccess,
  sellError,
  isSellLoading,
  onSellSubmit,
  allCars,
  setCurrentView
}) => {
  const { user, token, setShowAuthModal } = useAuth();

  if (currentView === 'sell-valuation') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <ValuationModal isPage={true} />
        </div>
        <SellSidebarInfo />
      </div>
    );
  }

  if (currentView === 'sell-inspection') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <InspectionModal isPage={true} />
        </div>
        <SellSidebarInfo />
      </div>
    );
  }

  if (currentView === 'sell-tracker') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <TrackerModal user={user} isPage={true} />
        </div>
        <SellSidebarInfo />
      </div>
    );
  }

  if (currentView === 'sell-tips') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <TipsModal isPage={true} />
        </div>
        <SellSidebarInfo />
      </div>
    );
  }

  if (currentView === 'sell-my-listings') {
    const myCars = allCars.filter(c => Number(c.created_by) === Number(user?.id));
    return (
      <div className="sell-car-container">
        <div className="tab-header">
          <h1>My Registered Listings</h1>
          <p>Track and manage the used cars you have listed for sale on CarSaathi.</p>
        </div>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
          {myCars.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <p style={{ color: 'var(--text-gray)', fontSize: '1rem', margin: '0 0 16px 0' }}>You have not listed any cars yet.</p>
              <button
                onClick={() => setCurrentView('sell')}
                className="sell-submit-btn"
                style={{ padding: '10px 20px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                List a Car Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {myCars.map(car => (
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
          )}
        </div>
      </div>
    );
  }

  // Main Sell Car View
  return (
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
            <form onSubmit={onSellSubmit} className="sell-form-box">
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
  );
};

export default SellCarView;
