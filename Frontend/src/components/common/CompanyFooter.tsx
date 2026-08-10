import React, { useState } from 'react';

interface CompanyFooterProps {
  setCurrentView: (view: any) => void;
  setSelectedCity: (city: string) => void;
  setSelectedCarId: (id: string | null) => void;
  triggerToast: (message: string, type: 'success' | 'error' | 'info') => void;
  handleResetToMainListing: () => void;
  setShowWishlistOnly?: (show: boolean) => void;
}

export const CompanyFooter: React.FC<CompanyFooterProps> = ({
  setCurrentView,
  setSelectedCity,
  setSelectedCarId,
  triggerToast,
  handleResetToMainListing,
  setShowWishlistOnly
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      triggerToast('Please enter a valid email address.', 'error');
      return;
    }
    triggerToast('🎉 Subscribed successfully! You will receive price drop alerts and car deals.', 'success');
    setNewsletterEmail('');
  };

  const navTo = (view: string) => {
    setSelectedCarId(null);
    if (setShowWishlistOnly) setShowWishlistOnly(false);
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCityAndNav = (city: string) => {
    setSelectedCity(city);
    setSelectedCarId(null);
    if (setShowWishlistOnly) setShowWishlistOnly(false);
    setCurrentView('preowned');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="company-footer">


      {/* 2. Main Footer Links & Info */}
      <div className="footer-main-wrapper">
        <div className="footer-columns-grid">
          {/* Column 1: Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header" onClick={() => { handleResetToMainListing(); scrollToTop(); }} style={{ cursor: 'pointer' }}>
              <span className="footer-logo-text">CarSaathi</span>
              <span className="footer-badge">India's #1 Car Hub</span>
            </div>
            <p className="footer-about-text">
              CarSaathi is India's leading AI-driven automotive ecosystem connecting millions of buyers and sellers. Experience hassle-free certified pre-owned cars, instant selling valuations, seamless auto loans, and doorstep vehicle maintenance.
            </p>
            <div className="footer-contact-details">
              <div className="contact-row">
                <span className="contact-icon">📞</span>
                <div>
                  <span className="contact-label">Toll-Free Helpline (24/7):</span>
                  <a href="tel:18001027228" className="contact-val">1800-102-7228</a>
                </div>
              </div>
              <div className="contact-row">
                <span className="contact-icon">📧</span>
                <div>
                  <span className="contact-label">Customer Support:</span>
                  <a href="mailto:support@carsaathi.com" className="contact-val">support@carsaathi.com</a>
                </div>
              </div>
              <div className="contact-row">
                <span className="contact-icon">🏢</span>
                <div>
                  <span className="contact-label">Corporate HQ:</span>
                  <span className="contact-val">CarSaathi Towers, Cyber City Phase 3, Gurugram, HR 122002</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links & Services */}
          <div className="footer-col">
            <h4 className="footer-heading">Services & Features</h4>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => navTo('preowned')}>🚗 Buy Used Certified Cars</button></li>
              <li><button type="button" onClick={() => navTo('new-cars')}>✨ Browse New Car Launches</button></li>
              <li><button type="button" onClick={() => navTo('sell')}>💰 Sell Your Car Instantly</button></li>
              <li><button type="button" onClick={() => navTo('sell-valuation')}>📊 Free Car Price Valuation</button></li>
              <li><button type="button" onClick={() => navTo('loan-apply')}>🏦 Apply for Car Finance</button></li>
              <li><button type="button" onClick={() => navTo('loan-calculator')}>🧮 EMI Interest Calculator</button></li>
              <li><button type="button" onClick={() => navTo('services')}>🔧 Doorstep Car Care & Servicing</button></li>
              <li><button type="button" onClick={() => navTo('ai-recommend')}>🤖 AI Smart Car Matchmaker</button></li>
            </ul>
          </div>

          {/* Column 3: Operating Hub Cities */}
          <div className="footer-col">
            <h4 className="footer-heading">Popular City Hubs</h4>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => selectCityAndNav('Delhi')}>Used Cars in Delhi NCR</button></li>
              <li><button type="button" onClick={() => selectCityAndNav('Mumbai')}>Used Cars in Mumbai</button></li>
              <li><button type="button" onClick={() => selectCityAndNav('Bangalore')}>Used Cars in Bangalore</button></li>
              <li><button type="button" onClick={() => selectCityAndNav('Hyderabad')}>Used Cars in Hyderabad</button></li>
              <li><button type="button" onClick={() => selectCityAndNav('Pune')}>Used Cars in Pune</button></li>
              <li><button type="button" onClick={() => selectCityAndNav('Kolkata')}>Used Cars in Kolkata</button></li>
              <li><button type="button" onClick={() => selectCityAndNav('all')}>All India Locations (150+)</button></li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Social */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-heading">Stay Ahead of Car Deals</h4>
            <p className="footer-newsletter-desc">
              Subscribe to get instant alerts on car price drops, newly listed certified vehicles, and seasonal service offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="footer-email-input"
                aria-label="Email for newsletter subscription"
              />
              <button type="submit" className="footer-subscribe-btn">
                Subscribe
              </button>
            </form>

            <div className="footer-social-section">
              <h5 className="social-heading">Follow CarSaathi</h5>
              <div className="footer-social-icons">
                <a href="#facebook" onClick={(e) => { e.preventDefault(); triggerToast('Connecting to CarSaathi Facebook...', 'info'); }} className="social-btn fb" aria-label="Facebook">
                  f
                </a>
                <a href="#twitter" onClick={(e) => { e.preventDefault(); triggerToast('Connecting to CarSaathi X / Twitter...', 'info'); }} className="social-btn tw" aria-label="Twitter">
                  𝕏
                </a>
                <a href="#instagram" onClick={(e) => { e.preventDefault(); triggerToast('Connecting to CarSaathi Instagram...', 'info'); }} className="social-btn ig" aria-label="Instagram">
                  📸
                </a>
                <a href="#youtube" onClick={(e) => { e.preventDefault(); triggerToast('Connecting to CarSaathi YouTube channel...', 'info'); }} className="social-btn yt" aria-label="YouTube">
                  ▶
                </a>
                <a href="#linkedin" onClick={(e) => { e.preventDefault(); triggerToast('Connecting to CarSaathi LinkedIn...', 'info'); }} className="social-btn in" aria-label="LinkedIn">
                  in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Popular Car Brands Strip */}
        <div className="footer-brands-strip">
          <div className="brands-strip-title">Popular Car Brands:</div>
          <div className="brands-tags-list">
            {['Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra', 'Toyota', 'Honda', 'Kia', 'MG Motor', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen'].map((brand) => (
              <button
                type="button"
                key={brand}
                className="brand-pill-tag"
                onClick={() => {
                  handleResetToMainListing();
                  scrollToTop();
                  triggerToast(`Filtering listings for ${brand}`, 'info');
                }}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Legal & Copyright Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <div className="copyright-text">
            © {new Date().getFullYear()} CarSaathi Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div className="legal-links">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast('Privacy Policy: CarSaathi strictly protects user data & financial confidentiality.', 'info'); }}>Privacy Policy</a>
            <span className="legal-sep">•</span>
            <a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast('Terms of Use: Standard marketplace & vehicle inspection terms apply.', 'info'); }}>Terms of Use</a>
            <span className="legal-sep">•</span>
            <a href="#security" onClick={(e) => { e.preventDefault(); triggerToast('Security Assurance: ISO 27001 Certified & 256-bit encrypted system.', 'info'); }}>Security</a>
            <span className="legal-sep">•</span>
            <a href="#investors" onClick={(e) => { e.preventDefault(); triggerToast('Investor Relations: CarSaathi is backed by leading global venture funds.', 'info'); }}>Investor Relations</a>
            <span className="legal-sep">•</span>
            <a href="#sitemap" onClick={(e) => { e.preventDefault(); triggerToast('Sitemap: Accessing comprehensive CarSaathi portal directory.', 'info'); }}>Sitemap</a>
          </div>
          <button type="button" onClick={scrollToTop} className="back-to-top-btn" aria-label="Scroll back to top of page">
            ▲ Top
          </button>
        </div>
      </div>
    </footer>
  );
};
