export const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

if (!API_BASE) {
  console.warn("⚠️ API_BASE is empty. Check VITE_API_BASE_URL/VITE_API_URL");
}
