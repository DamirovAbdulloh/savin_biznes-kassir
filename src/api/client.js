import axios from "axios";

// Backend prefixi "api/v1/" (config/urls.py).
// Lokal dev: vite proxy orqali "/api/v1/" ishlaydi (vite.config.js -> 127.0.0.1:8000).
// Production (Render): frontend va backend ALOHIDA domenlarda bo'lgani uchun
// build vaqtida VITE_API_URL env o'rnatilishi kerak, masalan:
//   VITE_API_URL=https://savin-backend.onrender.com/api/v1/
function normalizeBase(url) {
  if (!url) return "/api/v1/";
  return url.endsWith("/") ? url : `${url}/`;
}

export const API_BASE = normalizeBase(import.meta.env.VITE_API_URL);

const client = axios.create({
  baseURL: API_BASE,
});

function getTokens() {
  return {
    access: localStorage.getItem("savin_access"),
    refresh: localStorage.getItem("savin_refresh"),
  };
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("savin_access", access);
  if (refresh) localStorage.setItem("savin_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("savin_access");
  localStorage.removeItem("savin_refresh");
}

client.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshing = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const { refresh } = getTokens();
      if (!refresh) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        // Backend'dagi haqiqiy yo'l: users/urls.py -> "auth/token/refresh/"
        refreshing =
          refreshing ||
          axios.post(`${API_BASE}auth/token/refresh/`, { refresh }).then((res) => {
            setTokens({ access: res.data.access });
            refreshing = null;
            return res.data.access;
          });
        const newAccess = await refreshing;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch (refreshError) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default client;
