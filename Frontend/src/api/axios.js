import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nutri_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
