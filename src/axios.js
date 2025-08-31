// utils/axios.js
import axios from "axios";

// IMPORTANT: point this at your FastAPI origin (no trailing slash)
// e.g. VITE_API_URL=https://your-fastapi.up.railway.app
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // REQUIRED so browser sends/receives the FastAPI session cookie
  withCredentials: true,
});

// Optional: friendlier error shape everywhere
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const resp = err?.response;
    const data = resp?.data;
    err.userMessage =
      data?.detail ||
      data?.message ||
      resp?.statusText ||
      err.message ||
      "Request failed";
    return Promise.reject(err);
  }
);

export default api;
