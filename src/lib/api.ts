import axios from "axios";

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001/api";

export const axiosInstance = axios.create({ baseURL: BASE_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("jwt_token");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export async function login(username: string, password: string) {
  const res = await axiosInstance.post("/auth/login", { username, password });
  const { access_token } = res.data;
  localStorage.setItem("jwt_token", access_token);
  return res.data;
}

export function logout() {
  localStorage.removeItem("jwt_token");
  window.location.reload();
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("jwt_token");
}
