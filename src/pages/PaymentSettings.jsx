import React, { useEffect, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  getPaymentAccountsStatus,
  getPaymentAccountsEarnings,
  createStripeOnboardingLink,
  connectPayPalAccount,
} from "../api/billing";

export default function PaymentSettings({ embedded = false }) {
  const [status, setStatus] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [connectingPayPal, setConnectingPayPal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "complete") {
      setMessage("Payment account setup complete.");
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, earningsRes] = await Promise.all([
        getPaymentAccountsStatus().catch((err) => {
          console.error("Failed to load payment status", err);
          return { data: null };
        }),
        getPaymentAccountsEarnings().catch((err) => {
          console.error("Failed to load earnings", err);
          return { data: null };
        }),
      ]);

      if (statusRes?.data) {
        setStatus(statusRes.data);
        const email =
          statusRes.data.paypal_email ||
          statusRes.data.paypal?.email ||
          "";
        if (email) {
          setPaypalEmail(email);
        }
      }

      if (earningsRes?.data) {
        setEarnings(earningsRes.data);
      }
    } catch (err) {
      console.error("Failed to load payment settings", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load payment settings"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    setError("");
    setMessage("");
    try {
      const res = await createStripeOnboardingLink();
      const url =
        res?.data?.url ||
        res?.data?.onboarding_url ||
        res?.data?.redirectUrl;
      if (url) {
        window.location.href = url;
      } else {
        setError("Stripe onboarding link not available");
      }
    } catch (err) {
      console.error("Stripe onboarding failed", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to start Stripe onboarding"
      );
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleConnectPayPal = async (event) => {
    event.preventDefault();
    if (!paypalEmail) {
      setError("Enter your PayPal email first");
      return;
    }
    setConnectingPayPal(true);
    setError("");
    setMessage("");
    try {
      await connectPayPalAccount({ email: paypalEmail });
      setMessage("PayPal connected successfully.");
      await loadData();
    } catch (err) {
      console.error("PayPal connect failed", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to connect PayPal"
      );
    } finally {
      setConnectingPayPal(false);
    }
  };

  if (loading) {
    if (embedded) {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading payment settings...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  const paymentSetupCompleted = status?.payment_setup_completed;
  const stripeConnected =
    status?.stripe_connected || status?.stripe?.connected;
  const paypalConnected =
    status?.paypal_connected || status?.paypal?.connected;

  const currencySymbol = earnings?.currency_symbol || "£";
  const availableBalance =
    earnings?.available_balance ??
    earnings?.available ??
    earnings?.payout_available ??
    0;

  const breakdown = earnings?.breakdown || {};
  const subscriptions =
    earnings?.subscriptions ?? breakdown.subscriptions ?? 0;
  const contentSales =
    earnings?.content_sales ?? breakdown.content_sales ?? 0;
  const tips = earnings?.tips ?? breakdown.tips ?? 0;

  const content = (
    <>
      {paymentSetupCompleted === false && (
        <div className="mb-6 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-200">
              Complete your payment setup
            </p>
            <p className="text-xs text-yellow-100/80 mt-1">
              Connect at least one payment method to start receiving
              subscription and content earnings.
            </p>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex items-center gap-3 text-sm text-emerald-100">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-center gap-3 text-sm text-red-100">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <div className="space-y-6">
          <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Payment methods
                </h2>
                <p className="text-xs text-gray-400">
                  Connect at least one provider below. Stripe is required
                  for card payments.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Stripe
                    </span>
                    {stripeConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Card payments, subscriptions, and one-time purchases.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-4 h-4" />
                  {stripeConnected
                    ? "Manage in Stripe"
                    : connectingStripe
                    ? "Connecting..."
                    : "Connect Stripe"}
                </button>
              </div>

              <form
                onSubmit={handleConnectPayPal}
                className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      PayPal
                    </span>
                    {paypalConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Earnings will be sent to this PayPal email address.
                  </p>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(event) => setPaypalEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg bg-dark-bg border border-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={connectingPayPal}
                  className="md:w-40 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DollarSign className="w-4 h-4" />
                  {connectingPayPal ? "Saving..." : "Connect PayPal"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Earnings overview
                </h2>
                <p className="text-xs text-gray-400">
                  Snapshot of your available balance and recent earnings.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">
                Available balance
              </div>
              <div className="text-3xl font-bold text-white">
                {currencySymbol}
                {availableBalance.toFixed(2)}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                This is the amount that can be withdrawn to your connected
                payout account.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="text-[11px] text-gray-400 mb-1">
                  Subscriptions
                </div>
                <div className="text-base font-semibold text-white">
                  {currencySymbol}
                  {subscriptions.toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="text-[11px] text-gray-400 mb-1">
                  Content sales
                </div>
                <div className="text-base font-semibold text-white">
                  {currencySymbol}
                  {contentSales.toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="text-[11px] text-gray-400 mb-1">
                  Tips
                </div>
                <div className="text-base font-semibold text-white">
                  {currencySymbol}
                  {tips.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Payment settings
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Manage payment methods and view your earnings.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-200 border border-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Payment Settings
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Connect Stripe and PayPal to receive subscription and content
              earnings.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-200 border border-white/10 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

