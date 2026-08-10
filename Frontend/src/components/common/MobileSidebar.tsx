import React from 'react';
import type { ViewType, User } from '../../types';

interface MobileSidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCarId: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  user: User | null;
  token: string | null;
  showUserDropdown: boolean;
  setShowUserDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
  showWishlistOnly: boolean;
  setShowWishlistOnly: React.Dispatch<React.SetStateAction<boolean>>;
  wishlist: string[];
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
  setSelectedCarId,
  setCurrentView,
  user,
  token,
  showUserDropdown,
  setShowUserDropdown,
  setShowAuthModal,
  handleLogout,
  showWishlistOnly,
  setShowWishlistOnly,
  wishlist,
  theme,
  setTheme
}) => {
  return (
    <div className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="mobile-sidebar-header">
        <div className="brand-logo" onClick={() => { setSelectedCarId(null); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
          CarSaathi
        </div>
        <button className="sidebar-close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
          &times;
        </button>
      </div>

      <nav className="mobile-sidebar-nav">
        <div className="mobile-sidebar-footer" style={{ borderTop: 'none', borderBottom: '1px solid var(--border-light)', paddingTop: 0, paddingBottom: '15px', marginTop: 0, marginBottom: '10px' }}>
          <div className="mobile-profile-section" onClick={() => (user && token) ? setShowUserDropdown(!showUserDropdown) : setShowAuthModal(true)} style={{ marginBottom: '0px' }}>
            <span>👤 {(user && token) ? `Hello, ${user.name.split(' ')[0]}` : 'Sign In / Register'}</span>
            {user && token && (
              <button className="mobile-logout-btn" onClick={handleLogout}>Sign Out</button>
            )}
          </div>

          <button className="mobile-sidebar-btn" onClick={() => { setShowWishlistOnly(!showWishlistOnly); setSelectedCarId(null); setCurrentView('preowned'); }}>
            ❤️ Wishlist ({wishlist.length})
          </button>

          <button className="mobile-sidebar-btn" onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {/* Group 1: Preowned Cars */}
        <div className="mobile-nav-group">
          <div className="mobile-nav-group-title">🚗 Preowned Cars</div>
          <div className="mobile-nav-group-links">
            <button onClick={() => { setSelectedCarId(null); setCurrentView('preowned'); }}>View All Preowned Cars</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('ai-recommend'); }}>✨ AI Car Assistant</button>
          </div>
        </div>

        {/* Group 2: Sell Car */}
        <div className="mobile-nav-group">
          <div className="mobile-nav-group-title">💰 Sell Car</div>
          <div className="mobile-nav-group-links">
            <button onClick={() => { setSelectedCarId(null); setCurrentView('sell'); }}>List Your Car For Sale</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('sell-valuation'); }}>Instant Price Valuation</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('sell-inspection'); }}>Free Home Inspection</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('sell-my-listings'); }}>My Active Listings</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('sell-tracker'); }}>Payment & RC Tracker</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('sell-tips'); }}>Car Selling Tips & Guide</button>
          </div>
        </div>

        {/* Group 3: Car Loan */}
        <div className="mobile-nav-group">
          <div className="mobile-nav-group-title">💳 Car Loan</div>
          <div className="mobile-nav-group-links">
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-apply'); }}>Apply for Instant Loan</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-calculator'); }}>EMI & Interest Calculator</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-eligibility'); }}>Check Loan Eligibility</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-compare'); }}>Compare Bank Interest Rates</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-docs'); }}>Required Loan Documents</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-faqs'); }}>Financing FAQs</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('loan-track'); }}>Track Application Status</button>
          </div>
        </div>

        {/* Group 4: New Cars */}
        <div className="mobile-nav-group">
          <div className="mobile-nav-group-title">🆕 New Cars</div>
          <div className="mobile-nav-group-links">
            <button onClick={() => { setSelectedCarId(null); setCurrentView('new-cars'); }}>Explore New Car Models</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('new-launches'); }}>Latest & Upcoming Launches</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('new-compare'); }}>Compare New Cars</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('new-test-drive'); }}>Book Test Drive</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('new-brochure'); }}>Download Specs & Brochure</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('new-offers'); }}>Festive & Bank Offers</button>
          </div>
        </div>

        {/* Group 5: Car Services */}
        <div className="mobile-nav-group">
          <div className="mobile-nav-group-title">🔧 Car Services</div>
          <div className="mobile-nav-group-links">
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services'); }}>Book Annual Maintenance</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services-insurance'); }}>Motor Insurance Renewal</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services-inspection'); }}>140-Point Pre-Purchase Inspection</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services-rsa'); }}>24x7 Roadside Assistance</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services-history'); }}>Vehicle Service History Check</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services-centers'); }}>Nearby Service Centers</button>
            <button onClick={() => { setSelectedCarId(null); setCurrentView('services-wash'); }}>Doorstep Car Wash & Spa</button>
          </div>
        </div>

        {user && (user.role === 'Dealer' || user.role === 'Admin') && (
          <div className="mobile-nav-group">
            <div className="mobile-nav-group-title" style={{ color: 'var(--orange, #ff6f54)' }}>📊 Leads Dashboard</div>
            <div className="mobile-nav-group-links">
              <button onClick={() => { setSelectedCarId(null); setCurrentView('admin-leads'); }}>Open Leads & Bookings Dashboard</button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};
