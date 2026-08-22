import React from 'react';
import { formatINR, formatGBP } from '../../currency';
import { getCarImageUrl, handleImageError } from '../../utils/carImages';
import { getCarFuelType, getCarTransmission, getCarColor, getStateCode } from '../../utils/carHelpers';

interface CarCardProps {
  car: any;
  wishlist: string[];
  user: any;
  token: string | null;
  region: 'IN' | 'UK';
  priceFormat: 'lakh' | 'full';
  onSelect: (id: string) => void;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  onEdit: (car: any) => void;
  onDelete: (id: string) => void;
}

const CarCard: React.FC<CarCardProps> = ({
  car, wishlist, user, token, region, priceFormat,
  onSelect, onToggleWishlist, onEdit, onDelete
}) => {
  const carHash = typeof car.id === 'string' ? parseInt(car.id.slice(-4), 16) || 0 : car.id || 0;
  const mileage = car.kms_driven !== undefined && car.kms_driven !== null
    ? car.kms_driven
    : Math.round((2026 - car.year) * 11000 + (carHash * 850) % 12000);
  const fuelType = getCarFuelType(car);
  const transmission = getCarTransmission(car);
  const color = getCarColor(car);
  const stateCode = getStateCode(car.city);
  const emi = Math.round(car.price / 68);

  const canManage = user && token && (
    user.role === 'Admin' ||
    (user.role === 'Dealer' && (car.created_by === null || Number(user.id) === Number(car.created_by)))
  );

  return (
    <div className="car-card-cars24" onClick={() => onSelect(car.id)} style={{ cursor: 'pointer' }}>
      {/* Image Area */}
      <div className="card-image-box">
        {canManage && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
            <button
              className="card-edit-btn"
              onClick={(e) => { e.stopPropagation(); onEdit(car); }}
              style={{ background: '#8570f5', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              title="Edit Listing"
            >
              ✏️ Edit
            </button>
            <button
              className="card-delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(car.id); }}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              title="Delete Listing"
            >
              🗑️ Delete
            </button>
          </div>
        )}
        {car.similarity_score !== undefined && car.similarity_score !== null && (
          <span className="semantic-match-badge" style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(133, 112, 245, 0.9)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.15)', backdropFilter: 'blur(2px)' }}>
            ✨ {Math.round(car.similarity_score * 100)}% Semantic Match
          </span>
        )}
        <img src={getCarImageUrl(car)} alt={`${car.make} ${car.model}`} className="car-card-img" onError={handleImageError} />
        <span
          className="card-heart-btn"
          onClick={(e) => onToggleWishlist(car.id, e)}
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
};

export default CarCard;
