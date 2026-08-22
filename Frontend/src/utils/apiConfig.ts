// Resolved backend base URL for all API calls
export const API_URL = import.meta.env.VITE_API_URL ||
  ((window.location.port === '5173' || window.location.port === '5174' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || /^192\.168\./.test(window.location.hostname) || /^10\./.test(window.location.hostname) || /^172\./.test(window.location.hostname))
    ? `http://${window.location.hostname}:3000`
    : '');
