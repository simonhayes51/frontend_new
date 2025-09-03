import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.futhub.co.uk",
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `/login?next=${next}`;
    }
    return Promise.reject(err);
  }
);

export default api;
