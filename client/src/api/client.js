import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const tokenStore = {
  access: null,
  refresh: null,
  onRefreshed: null,
  onLogout: null,
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (tokenStore.access && config.auth !== false) {
    config.headers.Authorization = `Bearer ${tokenStore.access}`;
  }
  return config;
});

let refreshing = null;

async function refreshAccessToken() {
  if (!tokenStore.refresh) throw new Error("no refresh token");
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/auth/token/refresh/`, { refresh: tokenStore.refresh })
      .then((res) => {
        const { access, refresh } = res.data;
        tokenStore.access = access;
        if (refresh) tokenStore.refresh = refresh;
        if (tokenStore.onRefreshed) tokenStore.onRefreshed(access, refresh || tokenStore.refresh);
        return access;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && tokenStore.refresh) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        original.headers = { ...original.headers, Authorization: `Bearer ${access}` };
        return api(original);
      } catch {
        if (tokenStore.onLogout) tokenStore.onLogout();
      }
    }
    return Promise.reject(error);
  },
);

/** Turns any API/network failure into a friendly, human message. */
export function friendlyError(error, fallback = "Algo salió mal. Intenta de nuevo.") {
  if (!error) return fallback;
  const res = error.response;
  if (!res) {
    return "No pudimos conectar con el servidor. Revisa que el backend esté encendido.";
  }
  const data = res.data;
  const detail =
    (typeof data === "string" && data) ||
    data?.error ||
    data?.detail ||
    (data && typeof data === "object"
      ? Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" · ")
      : null);

  switch (res.status) {
    case 400:
      return detail || "Revisa los datos enviados, algo no es válido.";
    case 401:
      return detail || "Tu sesión expiró. Inicia sesión de nuevo.";
    case 409:
      return detail || "Esta película ya está en tus favoritas.";
    case 502:
      return detail || "El servicio de películas no respondió. Inténtalo en un momento.";
    default:
      return detail || fallback;
  }
}
