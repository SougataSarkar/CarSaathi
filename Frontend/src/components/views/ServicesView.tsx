import React from 'react';
import type { LeadService, ServiceFormData, ViewType } from '../../types';
import { useToast } from '../../context/ToastContext';
import InsuranceModal from '../modals/InsuranceModal';
import InspectionModal from '../modals/InspectionModal';
import WashModal from '../modals/WashModal';
import RsaModal from '../modals/RsaModal';
import HistoryModal from '../modals/HistoryModal';
import CentersModal from '../modals/CentersModal';
import ServicesSidebarInfo from '../sidebars/ServicesSidebarInfo';

interface ServicesViewProps {
  currentView: ViewType;
  selectedService: string | null;
  setSelectedService: (service: string | null) => void;
  serviceForm: ServiceFormData;
  setServiceForm: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  serviceSuccess: (LeadService & { service_name?: string; booking_date?: string }) | null;
  setServiceSuccess: (success: any) => void;
  serviceError: string | null;
  setServiceError: (err: string | null) => void;
  isServiceLoading: boolean;
  onServiceSubmit: (e: React.FormEvent) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  currentView,
  selectedService,
  setSelectedService,
  serviceForm,
  setServiceForm,
  serviceSuccess,
  setServiceSuccess,
  serviceError,
  setServiceError,
  isServiceLoading,
  onServiceSubmit
}) => {
  const { triggerToast } = useToast();

  if (currentView === 'services-insurance') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <InsuranceModal onToast={triggerToast} isPage={true} />
        </div>
        <ServicesSidebarInfo />
      </div>
    );
  }

  if (currentView === 'services-inspection') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <InspectionModal isPage={true} />
        </div>
        <ServicesSidebarInfo />
      </div>
    );
  }

  if (currentView === 'services-wash') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <WashModal isPage={true} />
        </div>
        <ServicesSidebarInfo />
      </div>
    );
  }

  if (currentView === 'services-rsa') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <RsaModal isPage={true} />
        </div>
        <ServicesSidebarInfo />
      </div>
    );
  }

  if (currentView === 'services-history') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <HistoryModal isPage={true} />
        </div>
        <ServicesSidebarInfo />
      </div>
    );
  }

  if (currentView === 'services-centers') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <CentersModal isPage={true} />
        </div>
        <ServicesSidebarInfo />
      </div>
    );
  }

  return (
    <div className="services-container">
      <div className="tab-header">
        <h1>Car Services & Periodic Spa</h1>
        <p>Book premium periodic service, air conditioning repair, wheel balancing, or deep detailing. Free doorstep pick-up & drop-off included.</p>
      </div>

      <div className="services-grid">
        <div className="services-list-left">
          {[
            {
              id: 'periodic-oil',
              name: 'Periodic Engine Oil Service',
              price: '₹ 2,999',
              desc: 'Full synthetic engine oil replacement, oil filter check, air filter cleaning, coolant top-up, and 40-point inspection check.',
              icon: '🛢️'
            },
            {
              id: 'car-detailing',
              name: 'Deep Detailing & Interior Spa',
              price: '₹ 4,499',
              desc: 'Deep foam exterior wash, clay bar paint treatment, interior dry vacuuming, dashboard polish, leather seats care, and premium wax coating.',
              icon: '✨'
            },
            {
              id: 'ac-repair',
              name: 'Periodic AC Service & Gas Topup',
              price: '₹ 1,899',
              desc: 'AC filter cleaning, condenser washing, AC vent disinfection, dashboard duct cleaning, gas pressure leak testing, and refrigerant recharge.',
              icon: '❄️'
            },
            {
              id: 'brake-inspection',
              name: 'Brake Pads Replacement & Inspection',
              price: '₹ 1,499',
              desc: 'Front brake pad cleaning/replacement, caliper cleaning, disc rotor inspection, brake oil top-up, and response diagnostic calibration.',
              icon: '🛑'
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
                <div><strong>Service:</strong> {serviceSuccess.service_name || serviceSuccess.service_type}</div>
                <div><strong>Date:</strong> {serviceSuccess.booking_date || serviceSuccess.date ? new Date(serviceSuccess.booking_date || serviceSuccess.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Confirmed'}</div>
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

              <form onSubmit={onServiceSubmit} className="booking-form-box">
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
  );
};

export default ServicesView;
