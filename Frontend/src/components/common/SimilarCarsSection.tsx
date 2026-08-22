import { useState, useEffect } from 'react';
import { formatCompactINR } from '../../currency';
import { API_URL } from '../../utils/apiConfig';
import { getCarImageUrl, handleImageError } from '../../utils/carImages';

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

export default SimilarCarsSection;
