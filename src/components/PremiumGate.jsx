// src/components/PremiumGate.jsx
import React from "react";
import { useEntitlements } from "../context/EntitlementsContext";
import { Crown, Star, Zap, ArrowRight, Sparkles } from "lucide-react";

// Full page premium required component
const PremiumRequiredPage = ({ feature, featureName, onBackToDashboard, onStartTrial }) => {
  const features = [
    {
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      title: "Smart Buy AI Suggestions",
      description: "AI-powered trading opportunities based on market analysis"
    },
    {
      icon: <Star className="w-5 h-5 text-purple-400" />,
      title: "Advanced Market Trends", 
      description: "Access 6h and 12h trending data with smart insights"
    },
    {
      icon: <Crown className="w-5 h-5 text-yellow-400" />,
      title: "Extended Analytics",
      description: "Deep dive into your trading performance with advanced metrics"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-green-400" />,
      title: "Priority Support",
      description: "Get help faster with premium customer support"
    }
  ];

  const plans = [
    {
      name: "Premium Monthly",
      price: "£9.99",
      period: "per month",
      popular: false,
      features: [
        "All premium features",
        "Smart Buy AI suggestions",
        "Advanced trending data",
        "Priority support",
        "Cancel anytime"
      ]
    },
    {
      name: "Premium Yearly",
      price: "£99.99",
      period: "per year",
      popular: true,
      savings: "Save £19.89",
      features: [
        "All premium features",
        "Smart Buy AI suggestions", 
        "Advanced trending data",
        "Priority support",
        "2 months free"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl shadow-yellow-400/20">
            <Crown className="w-10 h-10 text-black" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Premium Required
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-2">
            {featureName ? `${featureName} is a premium feature` : "This feature requires a premium subscription"}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Unlock the full power of FUT Trading</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Feature Preview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feat, index) => (
            <div 
              key={index}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/20">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-white text-sm">{feat.title}</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
            <p className="text-gray-400">Start your premium journey today</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-gray-900/70 backdrop-blur-sm border rounded-2xl p-8 hover:border-gray-600 transition-all duration-300 ${
                  plan.popular 
                    ? "border-purple-500 ring-2 ring-purple-500/20 transform scale-105" 
                    : "border-gray-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <div className="mt-2">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 text-green-400 flex-shrink-0">✓</div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onStartTrial}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-500/25"
                      : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <details className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 group">
              <summary className="font-semibold cursor-pointer text-white group-hover:text-gray-300">
                Can I cancel my subscription anytime?
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                Yes! You can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </details>

            <details className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 group">
              <summary className="font-semibold cursor-pointer text-white group-hover:text-gray-300">
                What payment methods do you accept?
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                We accept all major credit cards, PayPal, and other secure payment methods through our payment processor.
              </p>
            </details>

            <details className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 group">
              <summary className="font-semibold cursor-pointer text-white group-hover:text-gray-300">
                Is there a free trial?
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                We offer a 7-day free trial for new users. No credit card required to start - just sign up and explore all premium features.
              </p>
            </details>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 mb-4">
            Ready to supercharge your FUT trading?
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onBackToDashboard}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-white font-semibold transition-all duration-200 hover:border-gray-600"
            >
              Back to Dashboard
            </button>
            
            <button 
              onClick={onStartTrial}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl text-white font-bold shadow-lg hover:shadow-green-500/25 transition-all duration-200 flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Start Premium Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main PremiumGate component
export default function PremiumGate({ 
  feature = null, 
  requirePremium = true, 
  children, 
  fullPage = false, 
  featureName 
}) {
  const { loading, isPremium, features } = useEntitlements();

  if (loading) return null;

  const allowed = requirePremium ? isPremium : feature ? features.includes(feature) : true;

  if (allowed) return children || null;

  // Handle premium gate blocking - redirect to billing or show upgrade prompt
  const handleStartTrial = () => {
    // Redirect to your billing/subscription page
    window.location.href = '/billing';
    // Or if you have a React Router setup:
    // navigate('/billing');
  };

  const handleBackToDashboard = () => {
    // Go back to dashboard
    window.location.href = '/';
    // Or with React Router:
    // navigate('/');
  };

  // Full page premium required screen
  if (fullPage) {
    return (
      <PremiumRequiredPage
        feature={feature}
        featureName={featureName}
        onBackToDashboard={handleBackToDashboard}
        onStartTrial={handleStartTrial}
      />
    );
  }

  // Small inline premium gate (existing functionality but enhanced)
  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/30 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
      <div className="text-sm font-semibold text-purple-200 flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-sm">
          🔒
        </div>
        Premium Feature
      </div>
      <p className="text-xs text-gray-300 mb-3">
        {featureName ? `${featureName} requires` : "This feature requires"} a premium subscription to access advanced trading tools.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={handleStartTrial}
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 text-white font-medium transition-all"
        >
          <Crown className="w-3 h-3" />
          Upgrade Now
        </button>
        <span className="text-xs text-gray-400">Starting at £3/month</span>
      </div>
    </div>
  );
}
