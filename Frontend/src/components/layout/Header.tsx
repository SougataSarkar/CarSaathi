import React from 'react';
import type { ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWishlist } from '../../context/WishlistContext';
import { SearchIcon } from '../common/SearchIcon';

interface HeaderProps {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  uniqueCities: string[];
  showLocationDropdown: boolean;
  setShowLocationDropdown: (show: boolean) => void;
  showManualCities: boolean;
  setShowManualCities: (show: boolean) => void;
  citySearchQuery: string;
  setCitySearchQuery: (query: string) => void;
  isDetectingLocation: boolean;
  handleDetectLocation: () => Promise<void>;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  setSelectedCarId: (id: string | null) => void;
  setTabSelected: (tab: 'all' | 'luxe') => void;
  setSelectedMakes: (makes: string[]) => void;
  setSortBy: (sort: 'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'make_asc') => void;
  localSearchTerm: string;
  setLocalSearchTerm: (term: string) => void;
  setSearchTerm: (term: string) => void;
  setShowMyListingsOnly: (show: boolean) => void;
  setSellSuccess: (success: boolean) => void;
  setSellError: (err: string | null) => void;
  setLoanSuccess: (success: any) => void;
  setSelectedNewCar: (car: string | null) => void;
  setNewCarSuccess: (success: boolean) => void;
  setNewCarError: (err: string | null) => void;
  setSelectedService: (service: string | null) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isSearchingMobile: boolean;
  setIsSearchingMobile: (searching: boolean) => void;
  handleResetToMainListing: (e?: React.MouseEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCity,
  setSelectedCity,
  uniqueCities,
  showLocationDropdown,
  setShowLocationDropdown,
  showManualCities,
  setShowManualCities,
  citySearchQuery,
  setCitySearchQuery,
  isDetectingLocation,
  handleDetectLocation,
  currentView,
  setCurrentView,
  setSelectedCarId,
  setTabSelected,
  setSelectedMakes,
  setSortBy,
  localSearchTerm: _localSearchTerm,
  setLocalSearchTerm,
  setSearchTerm: _setSearchTerm,
  setShowMyListingsOnly,
  setSellSuccess,
  setSellError,
  setLoanSuccess,
  setSelectedNewCar,
  setNewCarSuccess,
  setNewCarError,
  setSelectedService,
  mobileMenuOpen,
  setMobileMenuOpen,
  isSearchingMobile: _isSearchingMobile,
  setIsSearchingMobile,
  handleResetToMainListing
}) => {
  const { user, token, showUserDropdown, setShowUserDropdown, setShowAuthModal, setShowCallbackModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { wishlist, showWishlistOnly, setShowWishlistOnly } = useWishlist();

  return (
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

                {/* Select manually city options */}
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
          onClick={toggleTheme}
          aria-label="Toggle light and dark mode themes"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="call-us-btn" onClick={() => setShowCallbackModal(true)}>📞 Call Us</button>
        <button
          className={`wishlist-toggle-btn ${showWishlistOnly ? 'active' : ''}`}
          onClick={() => { setShowWishlistOnly(!showWishlistOnly); setSelectedCarId(null); setCurrentView('preowned'); }}
          title={showWishlistOnly ? 'Show All Cars' : 'Show Wishlisted Cars'}
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
              <button onClick={logout} className="logout-btn">
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
    </header>
  );
};

export default Header;
