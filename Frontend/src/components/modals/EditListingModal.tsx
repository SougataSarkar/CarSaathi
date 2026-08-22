import React from 'react';
import type { Car, SellFormData } from '../../types';

interface EditListingModalProps {
  isOpen: boolean;
  editingCar: Car | null;
  editForm: SellFormData;
  setEditForm: React.Dispatch<React.SetStateAction<SellFormData>>;
  isEditLoading: boolean;
  editError: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  isOpen,
  editingCar,
  editForm,
  setEditForm,
  isEditLoading,
  editError,
  onClose,
  onSubmit
}) => {
  if (!isOpen || !editingCar) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content edit-car-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
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

        <form onSubmit={onSubmit} className="sell-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              onClick={onClose}
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
  );
};

export default EditListingModal;
