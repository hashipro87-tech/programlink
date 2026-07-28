import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://programlink-production.up.railway.app/api',
});

// ── Banner helpers ────────────────────────────────────────────────────────────
let bannerEl = null;

function showOfflineBanner() {
  if (bannerEl) return;
  bannerEl = document.createElement('div');
  bannerEl.id = 'api-offline-banner';
  bannerEl.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: #dc2626; color: white;
    padding: 10px 16px; text-align: center;
    font-size: 14px; font-family: sans-serif; font-weight: 500;
  `;
  bannerEl.textContent = '⚠️  Unable to reach the server — check your connection and try again.';
  document.body.prepend(bannerEl);
}

function hideOfflineBanner() {
  if (bannerEl) { bannerEl.remove(); bannerEl = null; }
}

// ── Attach JWT token on every request ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Handle responses ─────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => {
    hideOfflineBanner();
    return res;
  },
  (err) => {
    if (!err.response) {
      // Network error — server unreachable
      showOfflineBanner();
    } else {
      hideOfflineBanner();
      if (err.response.status === 401) {
        sessionStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
