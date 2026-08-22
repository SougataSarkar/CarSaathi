import React from 'react';
import type { LeadLoan, LoanFormData, ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import EligibilityModal from '../modals/EligibilityModal';
import CompareModal from '../modals/CompareModal';
import DocsModal from '../modals/DocsModal';
import FaqsModal from '../modals/FaqsModal';
import LoanTrackerModal from '../modals/LoanTrackerModal';
import LoanSidebarInfo from '../sidebars/LoanSidebarInfo';

interface LoanViewProps {
  currentView: ViewType;
  loanSuccess: LeadLoan | null;
  setLoanSuccess: (loan: LeadLoan | null) => void;
  loanError: string | null;
  loanForm: LoanFormData;
  setLoanForm: React.Dispatch<React.SetStateAction<LoanFormData>>;
  loanDocs: {
    identityProof: { name: string; data: string } | null;
    addressProof: { name: string; data: string } | null;
    incomeProof: { name: string; data: string } | null;
  };
  setLoanDocs: React.Dispatch<React.SetStateAction<{
    identityProof: { name: string; data: string } | null;
    addressProof: { name: string; data: string } | null;
    incomeProof: { name: string; data: string } | null;
  }>>;
  isLoanLoading: boolean;
  onLoanSubmit: (e: React.FormEvent) => void;
  loanAmount: number;
  setLoanAmount: (val: number) => void;
  loanInterest: number;
  setLoanInterest: (val: number) => void;
  loanTenure: number;
  setLoanTenure: (val: number) => void;
}

export const LoanView: React.FC<LoanViewProps> = ({
  currentView,
  loanSuccess,
  setLoanSuccess,
  loanError,
  loanForm,
  setLoanForm,
  loanDocs,
  setLoanDocs,
  isLoanLoading,
  onLoanSubmit,
  loanAmount,
  setLoanAmount,
  loanInterest,
  setLoanInterest,
  loanTenure,
  setLoanTenure
}) => {
  const { user } = useAuth();

  if (currentView === 'loan-eligibility') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <EligibilityModal isPage={true} />
        </div>
        <LoanSidebarInfo />
      </div>
    );
  }

  if (currentView === 'loan-compare') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <CompareModal isPage={true} />
        </div>
        <LoanSidebarInfo />
      </div>
    );
  }

  if (currentView === 'loan-docs') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <DocsModal isPage={true} />
        </div>
        <LoanSidebarInfo />
      </div>
    );
  }

  if (currentView === 'loan-faqs') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <FaqsModal isPage={true} />
        </div>
        <LoanSidebarInfo />
      </div>
    );
  }

  if (currentView === 'loan-track') {
    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <LoanTrackerModal user={user} isPage={true} />
        </div>
        <LoanSidebarInfo />
      </div>
    );
  }

  if (currentView === 'loan-calculator') {
    const r = loanInterest / 12 / 100;
    const n = loanTenure * 12;
    const emi = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const totalPayment = emi * n;
    const totalInterest = totalPayment - loanAmount;

    return (
      <div className="sub-option-split-container">
        <div className="sub-option-main-card">
          <div className="sub-option-page-card" style={{ margin: 0 }}>
            <div className="sub-option-page-header">
              <h2>EMI & Interest Calculator</h2>
              <p>Calculate your monthly outgoings based on amount, rate, and tenure.</p>
            </div>

            <div className="calculator-slider-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--text-dark)' }}>Requested Loan Amount</span>
                <strong style={{ color: 'var(--orange)' }}>₹ {loanAmount.toLocaleString('en-IN')}</strong>
              </div>
              <input
                type="range"
                min="100000"
                max="5000000"
                step="50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="loan-range-slider"
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div className="slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-gray)' }}>
                <span>₹ 1 Lakh</span>
                <span>₹ 50 Lakhs</span>
              </div>
            </div>

            <div className="calculator-slider-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--text-dark)' }}>Interest Rate (Annual)</span>
                <strong style={{ color: 'var(--orange)' }}>{loanInterest}% p.a.</strong>
              </div>
              <input
                type="range"
                min="7.5"
                max="15.0"
                step="0.1"
                value={loanInterest}
                onChange={(e) => setLoanInterest(Number(e.target.value))}
                className="loan-range-slider"
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div className="slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-gray)' }}>
                <span>7.5%</span>
                <span>15.0%</span>
              </div>
            </div>

            <div className="calculator-slider-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 'bold' }}>
                <span style={{ color: 'var(--text-dark)' }}>Loan Tenure</span>
                <strong style={{ color: 'var(--orange)' }}>{loanTenure} Years</strong>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={loanTenure}
                onChange={(e) => setLoanTenure(Number(e.target.value))}
                className="loan-range-slider"
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div className="slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-gray)' }}>
                <span>1 Year</span>
                <span>7 Years</span>
              </div>
            </div>

            <div className="calculator-results-box" style={{ background: 'var(--bg-body)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div className="result-main-emi" style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-gray)', fontWeight: 'bold' }}>Monthly Installment (EMI)</span>
                <h3 style={{ fontSize: '1.8rem', color: 'var(--orange)', margin: '4px 0 0 0', fontWeight: '800' }}>₹ {emi.toLocaleString('en-IN')} /mo</h3>
              </div>
              <div className="result-breakdown-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-gray)' }}>Principal Amount:</span>
                  <strong style={{ color: 'var(--text-dark)' }}>₹ {loanAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-gray)' }}>Interest Payable:</span>
                  <strong style={{ color: '#ef4444' }}>₹ {totalInterest.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-light)', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 'bold' }}>Total Cost of Loan:</span>
                  <strong style={{ color: '#10b981' }}>₹ {totalPayment.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        <LoanSidebarInfo />
      </div>
    );
  }

  // Main loan-apply view
  return (
    <div className="sub-option-split-container">
      <div className="sub-option-main-card">
        <div className="sub-option-page-card" style={{ margin: 0 }}>
          <div className="sub-option-page-header">
            <h2>Apply for Car Loan</h2>
            <p>Get pre-approved in minutes with our bank integration network.</p>
          </div>

          {loanSuccess ? (
            <div className="loan-success-certificate">
              <div className="success-icon">🏆</div>
              <h2 style={{ fontSize: '1.4rem', color: '#10b981', margin: '8px 0' }}>Instant Pre-Approval Certificate</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)' }}>Congratulations! Based on your criteria, you are eligible for our pre-approved loan offer.</p>
              <div className="certificate-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0', padding: '16px', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Applicant Name:</span> <strong>{loanSuccess.name}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phone Number:</span> <strong>{loanSuccess.phone}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Loan Eligibility:</span> <strong style={{ color: '#10b981' }}>₹ {Number(loanSuccess.amount).toLocaleString('en-IN')}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tenure Choice:</span> <strong>{loanSuccess.tenure_years} Years</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span> <strong className="status-badge-approved" style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '12px' }}>{loanSuccess.status || 'Approved'}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reference ID:</span> <strong>CS-LN-{loanSuccess.id}</strong></div>
              </div>
              <p className="cert-note" style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>Our banking partner will contact you shortly to complete the zero-documentation digital verification process.</p>
              <button onClick={() => setLoanSuccess(null)} className="cert-recalc-btn" style={{ padding: '10px 20px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '12px' }}>
                Apply again
              </button>
            </div>
          ) : (
            <div className="loan-form-box">
              <form onSubmit={onLoanSubmit} className="booking-form-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                {loanError && <div className="booking-error-msg" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ {loanError}</div>}

                <div className="booking-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="loan-name" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Full Name</label>
                  <input
                    type="text"
                    id="loan-name"
                    value={loanForm.name}
                    onChange={(e) => setLoanForm({ ...loanForm, name: e.target.value })}
                    placeholder="As on PAN Card"
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}
                    required
                  />
                </div>

                <div className="booking-field-row" style={{ display: 'flex', gap: '12px' }}>
                  <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="loan-phone" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Phone Number</label>
                    <input
                      type="tel"
                      id="loan-phone"
                      value={loanForm.phone}
                      onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                      placeholder="Mobile number"
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="loan-income" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Monthly Net Salary (₹)</label>
                    <input
                      type="number"
                      id="loan-income"
                      value={loanForm.income}
                      onChange={(e) => setLoanForm({ ...loanForm, income: e.target.value })}
                      placeholder="e.g. 65000"
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div className="booking-field-row" style={{ display: 'flex', gap: '12px' }}>
                  <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="loan-employment" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Employment Type</label>
                    <select
                      id="loan-employment"
                      value={loanForm.employment}
                      onChange={(e) => setLoanForm({ ...loanForm, employment: e.target.value })}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self Employed">Self Employed</option>
                      <option value="Business Owner">Business Owner</option>
                    </select>
                  </div>
                  <div className="booking-field-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="loan-credit" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Credit Score Estimate</label>
                    <select
                      id="loan-credit"
                      value={loanForm.creditScore}
                      onChange={(e) => setLoanForm({ ...loanForm, creditScore: e.target.value })}
                      style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="750+ (Excellent)">750+ (Excellent)</option>
                      <option value="700-750 (Good)">700-750 (Good)</option>
                      <option value="650-700 (Fair)">650-700 (Fair)</option>
                      <option value="Below 650 (Needs Work)">Below 650 (Needs Work)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="booking-submit-btn"
                  disabled={isLoanLoading}
                  style={{ marginTop: '12px', padding: '12px', background: 'var(--orange)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.92rem', width: '100%' }}
                >
                  {isLoanLoading ? 'Checking credit profile...' : 'Get Instant Pre-Approval Offer'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="sub-option-page-card" style={{ margin: '20px 0 0 0' }}>
          <div className="sub-option-page-header">
            <h2>Required Documents Checklist & Upload</h2>
            <p>Upload these soft copies to expedite your digital application processing.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {/* Item 1: Identity Proof */}
            <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🪪</span>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Identity Proof</span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-gray)' }}>Aadhaar Card, PAN Card, or Passport</span>
                  </div>
                </div>
                <span style={{ color: loanDocs.identityProof ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.78rem' }}>
                  {loanDocs.identityProof ? '✓ Uploaded' : '✗ Missing'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLoanDocs(prev => ({
                          ...prev,
                          identityProof: { name: file.name, data: reader.result as string }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="upload-identity"
                />
                <label
                  htmlFor="upload-identity"
                  style={{
                    padding: '6px 12px',
                    background: 'var(--orange)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Choose File
                </label>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {loanDocs.identityProof ? loanDocs.identityProof.name : 'No file chosen'}
                </span>
              </div>
            </div>

            {/* Item 2: Address Proof */}
            <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🏠</span>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Address Proof</span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-gray)' }}>Utility Bill, Rent Agreement, or Voter ID</span>
                  </div>
                </div>
                <span style={{ color: loanDocs.addressProof ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.78rem' }}>
                  {loanDocs.addressProof ? '✓ Uploaded' : '✗ Missing'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLoanDocs(prev => ({
                          ...prev,
                          addressProof: { name: file.name, data: reader.result as string }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="upload-address"
                />
                <label
                  htmlFor="upload-address"
                  style={{
                    padding: '6px 12px',
                    background: 'var(--orange)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Choose File
                </label>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {loanDocs.addressProof ? loanDocs.addressProof.name : 'No file chosen'}
                </span>
              </div>
            </div>

            {/* Item 3: Income Proof */}
            <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem' }}>📄</span>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Income Proof</span>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-gray)' }}>Salary Slips (last 3 months) or IT Returns</span>
                  </div>
                </div>
                <span style={{ color: loanDocs.incomeProof ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '0.78rem' }}>
                  {loanDocs.incomeProof ? '✓ Uploaded' : '✗ Missing'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLoanDocs(prev => ({
                          ...prev,
                          incomeProof: { name: file.name, data: reader.result as string }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="upload-income"
                />
                <label
                  htmlFor="upload-income"
                  style={{
                    padding: '6px 12px',
                    background: 'var(--orange)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Choose File
                </label>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                  {loanDocs.incomeProof ? loanDocs.incomeProof.name : 'No file chosen'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoanSidebarInfo />
    </div>
  );
};

export default LoanView;
