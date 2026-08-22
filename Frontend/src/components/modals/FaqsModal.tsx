import { useState } from 'react';

const FaqsModal = ({ onClose, isPage }: { onClose?: () => void; isPage?: boolean }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const innerContent = (
    <>
      {!isPage && onClose && <button className="auth-modal-close" onClick={onClose}>&times;</button>}
      <div className={isPage ? "sub-option-page-header" : ""} style={isPage ? {} : { textAlign: 'left' }}>
        {isPage ? (
          <h2>Car Loan FAQs</h2>
        ) : (
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Car Loan FAQs</h3>
        )}
        <p style={isPage ? {} : { margin: 0, fontSize: '0.8rem', color: 'var(--text-gray)' }}>Answers to common questions regarding used car financing.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0', textAlign: 'left' }}>
        {[
          { q: 'What is the minimum credit score required?', a: 'A credit rating score of 750 or higher is ideal to qualify for premium interest rates. However, applicants with lower ratings can still secure approvals with slightly modified loan tenures.' },
          { q: 'How is the loan eligibility calculated?', a: 'Eligibility is calculated such that your total liabilities (including the new car EMI) do not exceed 50% of your net monthly salary.' },
          { q: 'Can I get 100% funding on used cars?', a: 'Yes, select banking partners offer 100% on-road funding on certified pre-owned cars, depending on the age of the vehicle and your income profile.' },
          { q: 'Are there any pre-payment or foreclosure charges?', a: 'Public banks like SBI offer zero foreclosure fees, while private banks may charge 2% to 5% if paid within the initial 12 to 24 months of tenure.' }
        ].map((item, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              style={{ padding: '12px', background: 'var(--bg-body)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{item.q}</span>
              <span>{openIdx === idx ? '▲' : '▼'}</span>
            </div>
            {openIdx === idx && (
              <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4', background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (isPage) {
    return (
      <div className="sub-option-page-card">
        {innerContent}
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '32px 24px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};

export default FaqsModal;
