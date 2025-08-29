import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-production-1f1a.up.railway.app",
  withCredentials: true,
  timeout: 10000,
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication required, redirecting to login...');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
