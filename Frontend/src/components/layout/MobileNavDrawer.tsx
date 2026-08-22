import React from 'react';

type View = 'preowned' | 'sell' | 'loan-apply' | 'loan-calculator' | 'new-cars' | 'services' | 'ai-recommend' | 'admin-leads' |
  'sell-valuation' | 'sell-inspection' | 'sell-my-listings' | 'sell-tracker' | 'sell-tips' |
  'loan-eligibility' | 'loan-compare' | 'loan-docs' | 'loan-faqs' | 'loan-track' |
  'new-launches' | 'new-compare' | 'new-test-drive' | 'new-brochure' | 'new-offers' |
  'services-insurance' | 'services-inspection' | 'services-rsa' | 'services-history' | 'services-centers' | 'services-wash';

interface MobileNavDrawerProps {
  mobileMenuOpen: boolean;
  onClose: () => void;
  user: any;
  token: string | null;
  theme: 'dark' | 'light';
  wishlist: string[];
  showWishlistOnly: boolean;
  currentView: View;
  setCurrentView: (v: View) => void;
  setSelectedCarId: (id: string | null) => void;
  setTabSelected: (t: 'all' | 'luxe') => void;
  setSelectedMakes: (m: string[]) => void;
  setSelectedCity: (c: string) => void;
  setSortBy: (s: 'relevance' | 'price_asc' | 'price_desc' | 'year_desc' | 'make_asc') => void;
  setLocalSearchTerm: (s: string) => void;
  setShowWishlistOnly: (b: boolean) => void;
  setShowMyListingsOnly: (b: boolean) => void;
  setSellSuccess: (b: boolean) => void;
  setSellError: (e: string | null) => void;
  setLoanSuccess: (v: any) => void;
  setSelectedNewCar: (c: string | null) => void;
  setNewCarSuccess: (b: boolean) => void;
  setNewCarError: (e: string | null) => void;
  setSelectedService: (s: string | null) => void;
  setActiveAdminTab: (t: 'bookings' | 'services' | 'loans' | 'newCarLeads') => void;
  setShowAuthModal: (b: boolean) => void;
  setShowCallbackModal: (b: boolean) => void;
  setShowUserDropdown: (b: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  handleLogout: () => void;
}

const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  mobileMenuOpen, onClose, user, token, theme, wishlist, showWishlistOnly,
  currentView: _currentView, setCurrentView, setSelectedCarId, setTabSelected, setSelectedMakes, setSelectedCity,
  setSortBy, setLocalSearchTerm, setShowWishlistOnly, setShowMyListingsOnly,
  setSellSuccess, setSellError, setLoanSuccess, setSelectedNewCar, setNewCarSuccess, setNewCarError,
  setSelectedService, setActiveAdminTab, setShowAuthModal, setShowCallbackModal, setShowUserDropdown,
  setTheme, handleLogout
}) => {
  return (
    <>
      <div className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="brand-logo" onClick={() => { setSelectedCarId(null); onClose(); }} style={{ cursor: 'pointer' }}>
            CarSaathi
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            &times;
          </button>
        </div>

        <nav className="mobile-sidebar-nav">
          {/* Main quick action settings listed first */}
          <div className="mobile-sidebar-footer" style={{ borderTop: 'none', borderBottom: '1px solid var(--border-light)', paddingTop: 0, paddingBottom: '15px', marginTop: 0, marginBottom: '10px' }}>
            <div className="mobile-profile-section" onClick={() => (user && token) ? setShowUserDropdown(true) : setShowAuthModal(true)} style={{ marginBottom: '0px' }}>
              <span>👤 {(user && token) ? `Hello, ${user.name.split(' ')[0]}` : 'Sign In / Register'}</span>
              {user && token && (
                <button className="mobile-logout-btn" onClick={handleLogout}>Sign Out</button>
              )}
            </div>

            <button className="mobile-sidebar-btn" onClick={() => { setShowWishlistOnly(!showWishlistOnly); setSelectedCarId(null); setCurrentView('preowned'); }}>
              ❤️ Wishlist ({wishlist.length})
            </button>

            <button className="mobile-sidebar-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            <button className="mobile-sidebar-btn" onClick={() => setShowCallbackModal(true)}>
              📞 Call Us
            </button>
          </div>

          {/* Preowned Cars */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">🚗 Preowned Cars</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('preowned'); setTabSelected('all'); setSelectedMakes([]); setSelectedCity('all'); setSortBy('year_desc'); setLocalSearchTerm(''); setSelectedCarId(null); }}>Search All Cars</button>
              <button onClick={() => { setCurrentView('preowned'); setTabSelected('luxe'); setSelectedCarId(null); }}>Luxury Cars</button>
              <button onClick={() => { setCurrentView('ai-recommend'); setSelectedCarId(null); }}>AI Recommendation Assistant</button>
            </div>
          </div>

          {/* Sell Car */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">💰 Sell Car</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('sell'); setShowMyListingsOnly(false); setSellSuccess(false); setSellError(null); }}>List a Used Car</button>
              <button onClick={() => setCurrentView('sell-valuation')}>Free Car Valuation</button>
              <button onClick={() => setCurrentView('sell-inspection')}>Book Vehicle Inspection</button>
              <button onClick={() => { if (!user || !token) { setShowAuthModal(true); } else { setCurrentView('sell-my-listings'); setSelectedCarId(null); } }}>My Listings</button>
              <button onClick={() => { if (!user || !token) { setShowAuthModal(true); } else { setCurrentView('sell-tracker'); } }}>Track Listing Status</button>
              <button onClick={() => setCurrentView('sell-tips')}>Selling Tips</button>
            </div>
          </div>

          {/* Car Loan */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">💳 Car Loan</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('loan-apply'); setLoanSuccess(null); }}>Apply for Loan</button>
              <button onClick={() => setCurrentView('loan-eligibility')}>Loan Eligibility Checker</button>
              <button onClick={() => setCurrentView('loan-compare')}>Compare Loan Offers</button>
              <button onClick={() => setCurrentView('loan-calculator')}>Interest Rate Calculator</button>
              <button onClick={() => setCurrentView('loan-docs')}>Required Documents</button>
              <button onClick={() => setCurrentView('loan-faqs')}>Loan FAQs</button>
              <button onClick={() => { if (!user || !token) { setShowAuthModal(true); } else { setCurrentView('loan-track'); } }}>Track Application</button>
            </div>
          </div>

          {/* New Cars */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">🆕 New Cars</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('new-cars'); setSelectedNewCar(null); }}>Upcoming Cars</button>
              <button onClick={() => setCurrentView('new-launches')}>Latest Launches</button>
              <button onClick={() => setCurrentView('new-compare')}>Compare New Cars</button>
              <button onClick={() => setCurrentView('new-test-drive')}>Book Test Drive</button>
              <button onClick={() => setCurrentView('new-brochure')}>Download Brochure</button>
              <button onClick={() => { setCurrentView('new-cars'); setSelectedNewCar('General New Car Inquiry'); setNewCarSuccess(false); setNewCarError(null); }}>Submit Inquiry</button>
              <button onClick={() => setCurrentView('new-offers')}>New Car Offers</button>
            </div>
          </div>

          {/* Car Services */}
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title">🔧 Car Services</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setCurrentView('services'); setSelectedService('Periodic Engine Oil Service'); }}>Book Car Service</button>
              <button onClick={() => setCurrentView('services-insurance')}>Insurance Renewal</button>
              <button onClick={() => setCurrentView('services-inspection')}>Car Inspection</button>
              <button onClick={() => setCurrentView('services-wash')}>Car Wash</button>
              <button onClick={() => setCurrentView('services-rsa')}>Roadside Assistance</button>
              <button onClick={() => setCurrentView('services-history')}>Service History</button>
              <button onClick={() => setCurrentView('services-centers')}>Find Nearby Service Centers</button>
            </div>
          </div>

          {/* Admin/Dealer Leads */}
          {user && token && (user.role === 'Admin' || user.role === 'Dealer') && (
            <div className="mobile-nav-group">
              <div className="mobile-nav-group-title" style={{ color: 'var(--orange, #ff6f54)' }}>📊 Leads Dashboard</div>
              <div className="mobile-nav-group-links">
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('bookings'); }}>Test Drive Bookings</button>
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('services'); }}>Service Center Bookings</button>
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('loans'); }}>Loan Applications</button>
                <button onClick={() => { setCurrentView('admin-leads'); setActiveAdminTab('newCarLeads'); }}>New Car Inquiries</button>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={onClose}></div>
      )}
    </>
  );
};

export default MobileNavDrawer;
