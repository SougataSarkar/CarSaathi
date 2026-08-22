import React from 'react';
import type { Car, ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import CarCard from '../cards/CarCard';
import {
  POPULAR_BRANDS,
  QUICK_BRAND_PILLS,
  getCarFuelType,
  getCarTransmission,
  getCarColor
} from '../../utils/carHelpers';

interface PreownedViewProps {
  tabSelected: 'all' | 'luxe';
  setTabSelected: (tab: 'all' | 'luxe') => void;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  priceQuery: string;
  setPriceQuery: (query: string) => void;
  apiError: string | null;
  maxPriceFilter: number;
  setMaxPriceFilter: (price: number) => void;
  localSearchTerm: string;
  setLocalSearchTerm: (term: string) => void;
  allCars: Car[];
  cars: Car[];
  sortedCars: Car[];
  filteredCars: Car[];
  selectedMakes: string[];
  handleMakeToggle: (brand: string) => void;
  selectedFuels: string[];
  setSelectedFuels: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTransmissions: string[];
  setSelectedTransmissions: React.Dispatch<React.SetStateAction<string[]>>;
  selectedAge: string;
  setSelectedAge: (age: string) => void;
  selectedKms: string;
  setSelectedKms: (kms: string) => void;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  showMyListingsOnly: boolean;
  setShowMyListingsOnly: (show: boolean) => void;
  selectedCity: string;
  avgPrice: number;
  renderFormattedPrice: (price: number) => string;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'make_asc';
  setSortBy: (sort: 'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'make_asc') => void;
  searchTerm: string;
  region: 'IN' | 'UK';
  setRegion: (region: 'IN' | 'UK') => void;
  priceFormat: 'lakh' | 'full';
  setPriceFormat: React.Dispatch<React.SetStateAction<'lakh' | 'full'>>;
  isLoading: boolean;
  onSelectCar: (id: string) => void;
  onOpenEditModal: (car: Car) => void;
  onDeleteCar: (carId: string) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedCarId: (id: string | null) => void;
}

export const PreownedView: React.FC<PreownedViewProps> = ({
  tabSelected,
  setTabSelected,
  showMobileFilters,
  setShowMobileFilters,
  priceQuery,
  setPriceQuery,
  apiError,
  maxPriceFilter,
  setMaxPriceFilter,
  localSearchTerm,
  setLocalSearchTerm,
  allCars,
  cars,
  sortedCars,
  filteredCars,
  selectedMakes,
  handleMakeToggle,
  selectedFuels,
  setSelectedFuels,
  selectedTransmissions,
  setSelectedTransmissions,
  selectedAge,
  setSelectedAge,
  selectedKms,
  setSelectedKms,
  selectedColors,
  setSelectedColors,
  showMyListingsOnly,
  setShowMyListingsOnly,
  selectedCity,
  avgPrice,
  renderFormattedPrice,
  sortBy,
  setSortBy,
  searchTerm,
  region,
  setRegion,
  priceFormat,
  setPriceFormat,
  isLoading,
  onSelectCar,
  onOpenEditModal,
  onDeleteCar,
  setCurrentView,
  setSelectedCarId
}) => {
  const { user, token } = useAuth();
  const { wishlist, showWishlistOnly, toggleWishlist, setShowWishlistOnly } = useWishlist();

  return (
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
                const count = allCars.filter(c => getCarFuelType(c) === fuel).length;
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
                const count = allCars.filter(c => getCarTransmission(c) === trans).length;
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
                const count = allCars.filter(c => getCarColor(c) === color).length;
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
            sortedCars.map(car => (
              <CarCard
                key={car.id}
                car={car}
                wishlist={wishlist}
                user={user}
                token={token}
                region={region}
                priceFormat={priceFormat}
                onSelect={(id) => onSelectCar(id)}
                onToggleWishlist={toggleWishlist}
                onEdit={onOpenEditModal}
                onDelete={onDeleteCar}
              />
            ))
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
  );
};

export default PreownedView;
