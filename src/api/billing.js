import api from "../axios";

export const createCheckoutSession = (payload) =>
  api.post("/api/billing/create-checkout-session", payload);

export const getPaymentAccountsStatus = () =>
  api.get("/api/payment-accounts/status");

export const getPaymentAccountsEarnings = () =>
  api.get("/api/payment-accounts/earnings");

export const createStripeOnboardingLink = () =>
  api.post("/api/payment-accounts/stripe/connect/onboard");

export const connectPayPalAccount = (payload) =>
  api.post("/api/payment-accounts/paypal/connect", payload);

export const paypalSubscribe = (payload) =>
  api.post("/api/paypal/subscribe", payload);

export const completePaypalSubscription = (subscriptionId) =>
  api.post(`/api/paypal/subscription/${subscriptionId}/complete`);

export const paypalPurchase = (payload) =>
  api.post("/api/paypal/purchase", payload);

export const completePaypalPurchase = (orderId) =>
  api.post(`/api/paypal/purchase/${orderId}/complete`);
