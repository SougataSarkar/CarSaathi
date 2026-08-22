import React from 'react';

interface ToastNotificationProps {
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`custom-toast ${toast.type}`}>
      <span className="toast-icon">
        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default ToastNotification;
