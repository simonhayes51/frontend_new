// src/pages/Billing.jsx - Functional payment processing
import React, { useState, useEffect } from "react";
import { Crown, Star, Check, Zap, ArrowRight, CreditCard, Shield, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEntitlements } from "../context/EntitlementsContext";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Billing() {
  const { user } = useAuth();
  const { isPremium, refreshEntitlements } = useEntitlements();
  
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe"); // stripe, paypal
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const plans = {
    monthly: {
      price: "£9.99",
      period: "per month",
      total: "£9.99 per month",
      savings: null,
      priceId: "price_monthly_premium", // Your Stripe price ID
      amount: 999 // in pence
    },
    yearly: {
      price: "£8.33",
      period: "per month",
      total: "£99.99 per year",
      savings: "Save £19.89 (17% off)",
      priceId: "price_yearly_premium", // Your Stripe price ID
      amount: 9999 // in pence
    }
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Smart Buy AI Suggestions",
      description: "Get AI-powered recommendations for profitable trades",
      premium: true
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "Advanced Market Trends",
      description: "Access 6h, 12h, and 24h trending data with smart insights",
      premium: true
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "Advanced Analytics",
      description: "Sharpe ratio, max drawdown, risk-adjusted returns",
      premium: true
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Priority Support",
      description: "Get help faster with premium customer support",
      premium: true
    }
  ];

  // Load current subscription status
  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/billing/subscription`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error("Failed to load subscription:", error);
    }
  };

  const createCheckoutSession = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          priceId: plans[billingCycle].priceId,
          billingCycle,
          paymentMethod,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/billing?payment=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout or PayPal
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.sessionId && window.Stripe) {
        const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error("Invalid checkout response");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.message || "Failed to start checkout process");
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/billing/cancel-subscription`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Refresh subscription status
      await loadSubscriptionStatus();
      await refreshEntitlements();
      
      alert("Your subscription has been cancelled. You'll retain premium access until the end of your billing period.");
    } catch (error) {
      console.error("Cancel error:", error);
      setError(error.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/billing/update-payment-method`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update payment method");
      }

      // Redirect to customer portal
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error("Update payment error:", error);
      setError(error.message || "Failed to update payment method");
    } finally {
      setLoading(false);
    }
  };

  // If user is already premium, show subscription management
  if (isPremium && currentSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6">
              <Crown className="w-8 h-8 text-black" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Premium Active
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              You're enjoying all premium features
            </p>
          </div>

          {/* Current Subscription Card */}
          <div className="max-w-md mx-auto mb-12">
            <div className="bg-gray-900/70 border border-green-500/50 rounded-2xl p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-400 mb-2">Current Plan</h2>
                <div className="text-3xl font-black">{currentSubscription.plan_name}</div>
                <p className="text-gray-400 mt-2">
                  Next billing: {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
                </p>
                <p className="text-gray-400">
                  Amount: {currentSubscription.amount_display}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={updatePaymentMethod}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  Update Payment Method
                </button>
                
                <button
                  onClick={cancelSubscription}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-center">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}

          {/* Features List */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">Your Premium Features</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-green-900/20 rounded-xl border border-green-500/30">
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/20">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      {feature.title}
                      <Check className="w-4 h-4 text-green-400" />
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade page for non-premium users
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
            <Crown className="w-8 h-8 text-black" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Go Premium
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Unlock advanced trading tools and AI-powered insights
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-900/50 border border-gray-700 rounded-xl p-1 mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-gray-800 text-white border border-gray-600"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                billingCycle === "yearly"
                  ? "bg-gray-800 text-white border border-gray-600"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                17% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-center">
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-gray-900/70 border border-purple-500/50 rounded-2xl p-8 text-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Crown className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold">Premium Plan</h2>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black">{plans[billingCycle].price}</span>
                  <span className="text-gray-400">{plans[billingCycle].period}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{plans[billingCycle].total}</p>
                {plans[billingCycle].savings && (
                  <div className="mt-3">
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                      {plans[billingCycle].savings}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-3">Payment Method</div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setPaymentMethod("stripe")}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      paymentMethod === "stripe"
                        ? "border-purple-500 bg-purple-500/20 text-purple-300"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("paypal")}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      paymentMethod === "paypal"
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    PayPal
                  </button>
                </div>
              </div>

              <button
                onClick={createCheckoutSession}
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Start 7-Day Free Trial
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Secure payment • Cancel anytime • No commitment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">What's Included</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/20">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free vs Premium Comparison */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">Free vs Premium</h3>
          
          <div className="bg-gray-900/50 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Free Tier */}
              <div className="p-6 border-r border-gray-800">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  Free Tier
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Basic trade tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Profit/loss calculations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Basic trending (24h only)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Up to 3 watchlist items</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-4 h-4 text-gray-500">✕</div>
                    <span className="text-gray-500">AI suggestions</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-4 h-4 text-gray-500">✕</div>
                    <span className="text-gray-500">Advanced analytics</span>
                  </li>
                </ul>
              </div>

              {/* Premium Tier */}
              <div className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  Premium Tier
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Everything in Free +</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">AI-powered buy suggestions</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">6h, 12h, 24h trending data</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Unlimited watchlist items</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Advanced risk analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Priority customer support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 mb-4">
            Join thousands of profitable FUT traders
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white font-semibold transition-all duration-200"
            >
              Back to Dashboard
            </button>
            
            <button 
              onClick={createCheckoutSession}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl text-white font-bold shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  Start Free Trial
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
