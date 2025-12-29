import { useState, useEffect } from 'react';
import { paymentsApi } from '../../utils/api';
import { motion } from 'framer-motion';
import {
  Crown, Check, Star, Zap, Shield, Clock, CreditCard, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const MembershipPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  // Load plans and current membership
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansRes, membershipRes] = await Promise.all([
          paymentsApi.getPlans(),
          paymentsApi.getMyMembership()
        ]);
        setPlans(plansRes.data?.plans || []);
        setCurrentMembership(membershipRes.data?.membership || null);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle purchase
  const handlePurchase = async (plan) => {
    try {
      setProcessingPlanId(plan.id);
      
      // Load Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      // Create order
      const orderRes = await paymentsApi.createOrder({
        amount: plan.price,
        plan_id: plan.id
      });

      const { order_id, amount, currency, key_id } = orderRes.data;

      if (!key_id) {
        toast.error('Payment gateway not configured. Please contact admin.');
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount: amount * 100,
        currency: currency,
        name: 'FitMate Pro',
        description: `${plan.name} Membership`,
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id
            });
            
            toast.success('Payment successful! Membership activated.');
            
            // Refresh membership status
            const membershipRes = await paymentsApi.getMyMembership();
            setCurrentMembership(membershipRes.data?.membership || null);
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#F97316'
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanId(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setProcessingPlanId(null);
    }
  };

  // Get plan icon based on type
  const getPlanIcon = (planType) => {
    switch (planType?.toLowerCase()) {
      case 'premium':
      case 'gold':
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 'pro':
        return <Zap className="w-8 h-8 text-purple-500" />;
      case 'basic':
        return <Shield className="w-8 h-8 text-blue-500" />;
      default:
        return <Star className="w-8 h-8 text-orange-500" />;
    }
  };

  // Get plan gradient
  const getPlanGradient = (planType, index) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-green-500 to-emerald-500',
    ];
    if (planType?.toLowerCase() === 'premium' || planType?.toLowerCase() === 'gold') {
      return 'from-yellow-500 to-orange-500';
    }
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Membership Plans</h1>
        <p className="text-gray-400">Choose the perfect plan for your fitness journey</p>
      </div>

      {/* Current Membership Status */}
      {currentMembership && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-400">Active Membership</h3>
              <p className="text-gray-300">
                {currentMembership.membership_type} • {currentMembership.days_remaining} days remaining
              </p>
              <p className="text-xs text-gray-500">
                Expires: {new Date(currentMembership.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Popular badge */}
            {plan.membership_type?.toLowerCase() === 'premium' && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}

            {/* Plan header */}
            <div className={`bg-gradient-to-r ${getPlanGradient(plan.membership_type, index)} p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  {getPlanIcon(plan.membership_type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-white/80 text-sm">{plan.membership_type}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">₹{plan.price?.toLocaleString()}</span>
                <span className="text-white/80">/ {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Plan features */}
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature.trim()}</span>
                  </li>
                ))}
                {(!plan.features || plan.features.length === 0) && (
                  <>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Full gym access</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Workout tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">AI coach access</span>
                    </li>
                  </>
                )}
              </ul>

              {/* Duration info */}
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <Clock className="w-4 h-4" />
                <span>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''} validity</span>
              </div>

              {/* Purchase button */}
              <button
                onClick={() => handlePurchase(plan)}
                disabled={processingPlanId === plan.id}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  processingPlanId === plan.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${getPlanGradient(plan.membership_type, index)} text-white hover:shadow-lg hover:scale-[1.02]`
                }`}
              >
                {processingPlanId === plan.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {currentMembership ? 'Extend Membership' : 'Get Started'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl">
            <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Plans Available</h3>
            <p className="text-gray-400">Contact admin to add membership plans</p>
          </div>
        )}
      </div>

      {/* Payment Info */}
      <div className="bg-white/5 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm">
          🔒 Secure payments powered by Razorpay. Your payment information is encrypted and secure.
        </p>
      </div>
    </div>
  );
};

export default MembershipPlans;
