import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

function getToken() {
  return localStorage.getItem("accessToken");
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    const headers = (config.headers || {}) as Record<string, unknown>;
    (config.headers as any) = { ...headers, Authorization: `Bearer ${token}` };
  }

  // CSRF double-submit: send header for state-changing requests
  const method = String(config.method || "get").toLowerCase();
  const isStateChanging = !["get", "head", "options"].includes(method);
  if (isStateChanging) {
    const csrf = getCookie("csrfToken");
    if (csrf) {
      const headers = (config.headers || {}) as Record<string, unknown>;
      (config.headers as any) = { ...headers, "X-CSRF-Token": csrf };
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = (error.config || {}) as AxiosRequestConfig & { _retry?: boolean };

    const isRetryable =
      status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      typeof originalConfig.url === "string" &&
      !originalConfig.url.includes("/api/auth/refresh");

    if (!isRetryable) return Promise.reject(error);

    originalConfig._retry = true;

    try {
      const refreshResp = await api.post("/api/auth/refresh");
      const newToken = (refreshResp.data as any)?.accessToken as string | undefined;

      if (newToken) {
        localStorage.setItem("accessToken", newToken);
      }

      // CSRF token is automatically updated via Set-Cookie header
      // No need to manually update it here

      // Retry original request with new access token
      return api(originalConfig);
    } catch {
      localStorage.removeItem("accessToken");
      return Promise.reject(error);
    }
  }
);

