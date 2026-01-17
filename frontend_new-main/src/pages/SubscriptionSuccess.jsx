import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { completePaypalSubscription, completePaypalPurchase } from '../api/billing';
import toast from 'react-hot-toast';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const traderId = searchParams.get('trader');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('subscription');

  useEffect(() => {
    const handleSubscriptionCompletion = async () => {
      try {
        const paypalSubId = sessionStorage.getItem('paypal_subscription_id');
        const paypalPurchaseId = sessionStorage.getItem('paypal_purchase_id');
        
        if (paypalSubId) {
          setMode('subscription');
          await completePaypalSubscription(paypalSubId);
          sessionStorage.removeItem('paypal_subscription_id');
          toast.success('PayPal subscription confirmed!');
        } else if (paypalPurchaseId) {
          setMode('purchase');
          await completePaypalPurchase(paypalPurchaseId);
          sessionStorage.removeItem('paypal_purchase_id');
          toast.success('Purchase confirmed!');
        } else {
          setMode('subscription');
        }
        setLoading(false);
      } catch (err) {
        console.error('Subscription completion error:', err);
        setError('Failed to confirm subscription. Please contact support if you were charged.');
        setLoading(false);
      }
    };

    handleSubscriptionCompletion();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-cyan animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Verifying subscription...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-card">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          {mode === 'purchase' ? 'Purchase Complete!' : 'Subscription Active!'}
        </h1>
        
        <p className="text-gray-400 mb-8">
          {error
            ? <span className="text-red-400">{error}</span>
            : mode === 'purchase'
            ? "You now have access to this paid content."
            : "You now have access to premium content and features."}
        </p>

        <div className="space-y-4">
          {traderId ? (
            <Link
              to={`/trader/${traderId}`}
              className="block w-full bg-gradient-brand text-white py-4 rounded-xl font-bold hover:shadow-glow-cyan transition-all flex items-center justify-center gap-2"
            >
              Return to Trader Profile
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/feed"
              className="block w-full bg-gradient-brand text-white py-4 rounded-xl font-bold hover:shadow-glow-cyan transition-all"
            >
              Go to Feed
            </Link>
          )}
          
          <Link
            to="/settings/billing"
            className="block text-gray-500 hover:text-white transition-colors text-sm"
          >
            Manage Subscriptions
          </Link>
        </div>
      </div>
    </div>
  );
}
