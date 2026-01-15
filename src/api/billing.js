import api from "../axios";

export const createCheckoutSession = (payload) =>
  api.post("/api/billing/create-checkout-session", payload);
