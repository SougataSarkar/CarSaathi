import React from 'react';
import { formatINR } from '../../currency';
import { getCarImageUrl, handleImageError } from '../../utils/carImages';

interface AiRecommendViewProps {
  aiLoading: boolean;
  aiLoadingStep: number;
  aiRecommendations: any[];
  aiVerdict: string;
  aiError: string | null;
  aiPrompt: string;
  aiBudget: number;
  aiPurpose: string;
  aiFuelType: string;
  aiBodyType: string;
  aiPriority: string;
  allCars: any[];
  cars: any[];
  setAiRecommendations: (recs: any[]) => void;
  setAiPrompt: (p: string) => void;
  setAiBudget: (b: number) => void;
  setAiPurpose: (p: string) => void;
  setAiFuelType: (f: string) => void;
  setAiBodyType: (b: string) => void;
  setAiPriority: (p: string) => void;
  onGetRecommendations: (e: React.FormEvent) => void;
  onSelectCar: (id: string, car: any) => void;
}

const AiRecommendView: React.FC<AiRecommendViewProps> = ({
  aiLoading, aiLoadingStep, aiRecommendations, aiVerdict, aiError,
  aiPrompt, aiBudget, aiPurpose, aiFuelType, aiBodyType, aiPriority,
  allCars, cars,
  setAiRecommendations, setAiPrompt, setAiBudget, setAiPurpose,
  setAiFuelType, setAiBodyType, setAiPriority,
  onGetRecommendations, onSelectCar
}) => {
  return (
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
              <span>Filtering by budget constraint &amp; body type parameters...</span>
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
          <div className="details-back-bar" onClick={() => setAiRecommendations([])} style={{ marginBottom: '20px', display: 'inline-flex' }}>
            <span>← Edit AI Preferences / Search Again</span>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '24px', marginBottom: '30px', boxShadow: 'var(--shadow-subtle)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 AI Assistant's Verdict &amp; Matched Database Listings
            </h3>
            <p style={{ color: 'var(--text-gray)', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>{aiVerdict}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
              {aiRecommendations.map(rec => {
                const fullCar = allCars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId)) || cars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId));
                if (!fullCar) return null;
                return (
                  <div
                    key={rec.carId}
                    onClick={() => onSelectCar(fullCar.id, fullCar)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, rgba(133, 112, 245, 0.12), rgba(255, 111, 84, 0.12))', border: '1px solid var(--brand)', borderRadius: '20px', padding: '6px 14px', fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-dark)', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
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

          <div className="ai-results-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {aiRecommendations.map((rec) => {
              const fullCar = allCars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId)) || cars.find(c => c.id === rec.carId || String(c.id) === String(rec.carId));
              if (!fullCar) return null;
              return (
                <div key={rec.carId} className="ai-rec-card" style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', overflow: 'hidden', transition: 'all 0.3s', boxShadow: 'var(--shadow-subtle)' }}>
                  <div className="ai-rec-img-wrapper" style={{ width: '320px', minWidth: '320px', position: 'relative', cursor: 'pointer' }} onClick={() => onSelectCar(fullCar.id, fullCar)}>
                    <img src={getCarImageUrl(fullCar)} alt={`${fullCar.make} ${fullCar.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={handleImageError} />
                    <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {fullCar.city}
                    </div>
                  </div>

                  <div className="ai-rec-content-wrapper" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="ai-rec-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{fullCar.year} {fullCar.make} {fullCar.model}</h3>
                        <span className="ai-rec-match-score" style={{ padding: '6px 12px', borderRadius: '20px', background: rec.matchScore >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(133, 112, 245, 0.15)', color: rec.matchScore >= 90 ? '#10b981' : 'var(--brand)', fontWeight: 'bold', fontSize: '0.85rem', border: `1px solid ${rec.matchScore >= 90 ? '#10b981' : 'var(--brand)'}` }}>
                          ✨ {rec.matchScore}% Match
                        </span>
                      </div>

                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--orange)', marginBottom: '16px' }}>
                        {formatINR(fullCar.price)}
                      </div>

                      <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: 'var(--radius-input)', borderLeft: '4px solid var(--brand)', marginBottom: '16px' }}>
                        <span style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--brand)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                          Why AI recommends this:
                        </span>
                        <p style={{ margin: 0, color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: '1.5' }}>{rec.reason}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => onSelectCar(fullCar.id, fullCar)}
                        className="call-us-btn"
                        style={{ flex: 1, padding: '10px 16px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', textAlign: 'center' }}
                      >
                        Inspect Details &amp; Book Test Drive
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

          <form onSubmit={onGetRecommendations} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="ai-params-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Budget Selector */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Maximum Budget</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="range" min="300000" max="9000000" step="50000" value={aiBudget} onChange={(e) => setAiBudget(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--brand)' }} />
                  <span style={{ width: '100px', fontWeight: 'bold', color: 'var(--orange)', textAlign: 'right', fontSize: '0.95rem' }}>₹{(aiBudget / 100000).toFixed(1)}L</span>
                </div>
              </div>

              {/* Driving Purpose */}
              <div>
                <label htmlFor="ai-purpose" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Primary Driving Purpose</label>
                <select id="ai-purpose" value={aiPurpose} onChange={(e) => setAiPurpose(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', cursor: 'pointer' }}>
                  <option value="commuting">Daily City Commute</option>
                  <option value="family">Family Road Trips</option>
                  <option value="adventure">Off-Road &amp; Adventure</option>
                  <option value="luxury">Luxury &amp; Comfort</option>
                  <option value="performance">Speed &amp; Performance</option>
                </select>
              </div>

              {/* Fuel Preference */}
              <div>
                <label htmlFor="ai-fuel" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Fuel Type Preference</label>
                <select id="ai-fuel" value={aiFuelType} onChange={(e) => setAiFuelType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', cursor: 'pointer' }}>
                  <option value="Any">No Preference (Any)</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric / EV</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              {/* Body Type Preference */}
              <div>
                <label htmlFor="ai-body" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Body Style Preference</label>
                <select id="ai-body" value={aiBodyType} onChange={(e) => setAiBodyType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', cursor: 'pointer' }}>
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
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', fontSize: '0.9rem' }}>What is your absolute highest priority?</label>
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
                    style={{ padding: '10px 18px', borderRadius: '20px', border: '1px solid', borderColor: aiPriority === p.key ? 'var(--brand)' : 'var(--border-light)', background: aiPriority === p.key ? 'rgba(133, 112, 245, 0.15)' : 'var(--bg-tertiary)', color: aiPriority === p.key ? 'var(--brand)' : 'var(--text-dark)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Description Textarea */}
            <div>
              <label htmlFor="ai-prompt-desc" style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Describe any specific needs in your own words (Optional)</label>
              <textarea
                id="ai-prompt-desc"
                placeholder="e.g. I need a robust family SUV with automatic transmission under 15 Lakh for highway trips and weekend travel..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={{ width: '100%', height: '100px', padding: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-input)', color: 'var(--text-dark)', resize: 'vertical', fontSize: '0.95rem' }}
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="booking-submit-btn" style={{ background: 'linear-gradient(135deg, var(--brand), var(--orange))', color: '#fff', border: 'none', fontSize: '1.1rem', padding: '14px', borderRadius: 'var(--radius-input)', cursor: 'pointer', fontWeight: '700', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(255, 111, 84, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              ✨ Analyze &amp; Recommend Perfect Matches
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiRecommendView;
