import axios from 'axios';
import { session } from './session';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = session.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isAuthUrl = (url = '') =>
  url.includes('auth/login') || url.includes('auth/token/refresh');

let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refresh = session.getRefresh();
    if (!refresh) return Promise.reject(new Error('No hay refresh token'));

    refreshPromise = axios
      .post(`${baseURL}/auth/token/refresh/`, { refresh })
      .then(({ data }) => {
        session.setTokens(data);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isUnauthorized = error.response?.status === 401;

    if (!isUnauthorized || !original || original._retry || isAuthUrl(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    let access;
    try {
      access = await refreshAccessToken();
    } catch {
      session.notifyExpired();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${access}`;
    return axiosClient(original);
  }
);

export default axiosClient;