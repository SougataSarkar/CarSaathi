import React from 'react';
import { formatINR, formatGBP } from '../../currency';
import { getCarImageUrl, handleImageError } from '../../utils/carImages';
import { getCarFuelType, getCarTransmission, getStateCode } from '../../utils/carHelpers';
import SimilarCarsSection from '../common/SimilarCarsSection';

interface CarDetailsViewProps {
  selectedCar: any;
  wishlist: string[];
  user: any;
  token: string | null;
  region: 'IN' | 'UK';
  bookingForm: { name: string; phone: string; date: string; time: string };
  bookingSuccess: any;
  bookingError: string | null;
  isBookingLoading: boolean;
  onBack: () => void;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onBookingSubmit: (e: React.FormEvent) => void;
  onBookingFormChange: (form: { name: string; phone: string; date: string; time: string }) => void;
  onBookingSuccessReset: () => void;
  onSelectCar: (id: string) => void;
  onOpenLightbox: () => void;
  onOpenEditModal: (car: any) => void;
}

const CarDetailsView: React.FC<CarDetailsViewProps> = ({
  selectedCar, wishlist, user, token, region,
  bookingForm, bookingSuccess, bookingError, isBookingLoading,
  onBack, onToggleWishlist, onBookingSubmit, onBookingFormChange,
  onBookingSuccessReset, onSelectCar, onOpenLightbox, onOpenEditModal
}) => {
  if (!selectedCar) {
    return (
      <div className="details-loading-box">
        <div className="details-spinner"></div>
        <h3>Loading Certified Details...</h3>
        <p>Pulling condition report, specs and test logs from CarSaathi backend database.</p>
      </div>
    );
  }

  const canEdit = user && token && (
    user.role === 'Admin' ||
    (user.role === 'Dealer' && (selectedCar.created_by === null || Number(user.id) === Number(selectedCar.created_by)))
  );

  return (
    <div>
      {/* Back to search results bar */}
      <div className="details-back-bar" onClick={onBack}>
        <span>← Back to search results</span>
      </div>

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
          <div className="details-image-wrapper" onClick={onOpenLightbox}>
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
              onClick={(e) => onToggleWishlist(selectedCar.id, e)}
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
            <div className="feature-item-checked">✓ Dual Front Airbags (Driver &amp; Passenger)</div>
            <div className="feature-item-checked">✓ Fully Automatic Climate Control</div>
            <div className="feature-item-checked">✓ Reverse Parking Camera with Sensors</div>
            <div className="feature-item-checked">✓ Steering Mounted Audio Controls</div>
            <div className="feature-item-checked">✓ Touchscreen SmartPlay Infotainment System</div>
            <div className="feature-item-checked">✓ Keyless Smart Entry with Push Start/Stop Button</div>
            <div className="feature-item-checked">✓ Electrically Adjustable &amp; Foldable ORVMs</div>
          </div>

          {/* Certified checklist card */}
          <div className="details-guarantee-card">
            <div className="guarantee-icon">🛡️</div>
            <div className="guarantee-info">
              <h3>CarSaathi Assured Guarantee</h3>
              <p>Every pre-owned vehicle on CarSaathi undergoes a stringent 140-point quality check testing engine compression, brakes, electronics, suspension, and steering. Includes 1-year comprehensive engine &amp; gearbox warranty and 7-day money-back assurance.</p>
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
            {canEdit && (
              <button
                className="details-edit-btn"
                onClick={() => onOpenEditModal(selectedCar)}
                style={{ marginTop: '10px', background: 'linear-gradient(135deg, #8570f5, #ff6f54)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(133, 112, 245, 0.4)' }}
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
              onClick={(e) => onToggleWishlist(selectedCar.id, e)}
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
                <button onClick={onBookingSuccessReset} className="book-another-btn">
                  Change / Book another slot
                </button>
              </div>
            ) : (
              <form onSubmit={onBookingSubmit} className="booking-form-box">
                {bookingError && <div className="booking-error-msg">⚠️ {bookingError}</div>}

                <div className="booking-field-group">
                  <label htmlFor="booking-name">Full Name</label>
                  <input
                    type="text"
                    id="booking-name"
                    value={bookingForm.name}
                    onChange={(e) => onBookingFormChange({ ...bookingForm, name: e.target.value })}
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
                    onChange={(e) => onBookingFormChange({ ...bookingForm, phone: e.target.value })}
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
                      onChange={(e) => onBookingFormChange({ ...bookingForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="booking-field-group" style={{ flex: 1 }}>
                    <label htmlFor="booking-time">Time Slot</label>
                    <select
                      id="booking-time"
                      value={bookingForm.time}
                      onChange={(e) => onBookingFormChange({ ...bookingForm, time: e.target.value })}
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

                <button type="submit" className="booking-submit-btn" disabled={isBookingLoading}>
                  {isBookingLoading ? 'Processing Booking...' : 'Schedule Doorstep Test Drive'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <SimilarCarsSection carId={selectedCar.id} onSelectCar={onSelectCar} />
    </div>
  );
};

export default CarDetailsView;
