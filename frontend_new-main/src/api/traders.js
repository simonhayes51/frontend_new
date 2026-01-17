import api from "../axios";

// Helper for multi-path GET
const tryGet = async (paths, config) => {
  let lastError;
  for (const path of paths) {
    try {
      return await api.get(path, config);
    } catch (error) {
      if (error?.response?.status !== 404) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

// Helper for multi-path PUT
const tryPut = async (paths, payload) => {
  let lastError;
  for (const path of paths) {
    try {
      return await api.put(path, payload);
    } catch (error) {
      if (![404, 405].includes(error?.response?.status)) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

// 1. Trader Onboarding
export const upgradeToTrader = (payload) =>
  api.post("/api/traders/upgrade", payload);

// 2. Trader Dashboard
export const getTraderMe = () =>
  tryGet(["/api/traders/me", "/api/social/traders/me"]);

export const updateTraderMe = (payload) =>
  tryPut(["/api/traders/me", "/api/social/traders/me"], payload);

export const getTraderAnalytics = () =>
  tryGet(["/api/traders/analytics", "/api/social/traders/analytics"]);

// 3. Public Trader Profile
export const getTraderProfile = (userId) =>
  tryGet([`/api/traders/${userId}`, `/api/social/traders/${userId}`]);
