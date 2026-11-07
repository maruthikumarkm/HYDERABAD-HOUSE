import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Banknote,
  Award,
  Clock,
  Sparkles,
  QrCode,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface PhonePeSession {
  merchantTransactionId: string;
  amount: number;
  redirectUrl: string;
  qrString: string;
  status: string;
}

export const CartDrawer: React.FC = () => {
  const { 
    items, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal, 
    taxAmount, 
    deliveryFee, 
    couponDiscount, 
    couponCode, 
    loyaltyDiscount,
    pointsToRedeem,
    setPointsToRedeem,
    applyCoupon, 
    removeCoupon,
    totalAmount,
    selectedOutlet,
    orderType,
    setOrderType,
    isPartyOrder,
    partyDetails
  } = useCart();

  const { user, isAuthenticated, updateLoyaltyPoints } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Royal Palms, Botanical Garden Road, Kondapur, Hyderabad');
  const [customerName, setCustomerName] = useState(user?.name || 'Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+919876543210');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PhonePe Checkout Modal state
  const [phonePeSession, setPhonePeSession] = useState<PhonePeSession | null>(null);
  const [isPhonePeModalOpen, setIsPhonePeModalOpen] = useState(false);
  const [phonePeStatus, setPhonePeStatus] = useState<'INITIATING' | 'WAITING' | 'SUCCESS' | 'FAILED'>('WAITING');
  const [phonePeTimeLeft, setPhonePeTimeLeft] = useState(300); // 5 min countdown
  const [isSimulating, setIsSimulating] = useState(false);

  // Polling for PhonePe payment status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (isPhonePeModalOpen && phonePeSession?.merchantTransactionId && phonePeStatus === 'WAITING') {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/payments/phonepe/status/${phonePeSession.merchantTransactionId}`);
          if (res.data?.status === 'COMPLETED' || res.data?.status === 'SUCCESS') {
            setPhonePeStatus('SUCCESS');
            if (pollInterval) clearInterval(pollInterval);

            // Celebrate with confetti
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            // Update loyalty points
            if (user?.loyaltyPoints !== undefined) {
              updateLoyaltyPoints(user.loyaltyPoints - pointsToRedeem + Math.floor(phonePeSession.amount * 0.1));
            }

            // Clear cart & redirect
            setTimeout(() => {
              clearCart();
              setIsPhonePeModalOpen(false);
              setIsCartOpen(false);
              navigate(`/track/${res.data.orderNumber}`);
            }, 1200);
          } else if (res.data?.status === 'FAILED') {
            setPhonePeStatus('FAILED');
            if (pollInterval) clearInterval(pollInterval);
            setErrorMsg('PhonePe payment failed or expired. Please try again.');
          }
        } catch (e) {
          console.error('Error checking PhonePe payment status', e);
        }
      }, 2500);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isPhonePeModalOpen, phonePeSession, phonePeStatus]);

  // PhonePe Countdown timer
  useEffect(() => {
    if (!isPhonePeModalOpen || phonePeStatus !== 'WAITING') return;
    if (phonePeTimeLeft <= 0) {
      setPhonePeStatus('FAILED');
      setErrorMsg('Payment session expired. Please reinitiate checkout.');
      return;
    }

    const timer = setInterval(() => {
      setPhonePeTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPhonePeModalOpen, phonePeStatus, phonePeTimeLeft]);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput.trim().toUpperCase());
    setCouponMsg({ text: res.message, isError: !res.success });
    if (res.success) setCouponInput('');
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!selectedOutlet) {
      setErrorMsg('Please select an outlet before placing order.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      setIsCartOpen(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      outletId: selectedOutlet.id,
      orderType: isPartyOrder ? 'PARTY_BULK' : orderType,
      deliveryAddress: orderType === 'DELIVERY' || isPartyOrder ? (partyDetails?.deliveryAddress || deliveryAddress) : 'Takeaway Counter',
      customerName: user?.name || partyDetails?.contactName || customerName,
      customerPhone: user?.phone || partyDetails?.contactPhone || customerPhone,
      specialInstructions: partyDetails?.specialInstructions || specialInstructions,
      couponCode: couponDiscount > 0 ? couponCode : null,
      pointsToRedeem,
      paymentMethod,
      isPartyOrder: isPartyOrder || false,
      eventType: partyDetails?.eventType || 'Party Feast',
      eventDate: partyDetails?.eventDate || null,
      eventTime: partyDetails?.eventTime || '19:30',
      guestCount: partyDetails?.guestCount || null,
      items: items.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        portionSize: item.portionSize,
        spiceLevel: item.spiceLevel,
        specialInstructions: item.specialInstructions,
        addOnsJson: item.selectedAddOns ? JSON.stringify(item.selectedAddOns) : null,
        unitPrice: item.unitPrice,
      })),
    };

    if (paymentMethod === 'UPI') {
      try {
        const res = await api.post('/payments/phonepe/initiate', payload);
        setPhonePeSession(res.data);
        setPhonePeStatus('WAITING');
        setPhonePeTimeLeft(300);
        setIsPhonePeModalOpen(true);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error || 'Failed to initiate PhonePe payment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // CASH / Pay at Counter
      try {
        const res = await api.post('/orders/create', payload);
        const createdOrder = res.data;

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        clearCart();
        setIsCartOpen(false);

        if (user?.loyaltyPoints !== undefined) {
          updateLoyaltyPoints(user.loyaltyPoints - pointsToRedeem + Math.floor(createdOrder.totalAmount * 0.1));
        }

        navigate(`/track/${createdOrder.orderNumber}`);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error || 'Failed to place order. Please check item availability.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSimulatePayment = async (action: 'SUCCESS' | 'FAIL') => {
    if (!phonePeSession) return;
    setIsSimulating(true);
    try {
      await api.post('/payments/phonepe/simulate-action', {
        merchantTransactionId: phonePeSession.merchantTransactionId,
        action,
      });
      // The poll interval will pick up the updated status immediately
    } catch (e) {
      console.error('Failed to simulate action', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)} 
        className="absolute inset-0 bg-charcoal-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-cream-200">
          {/* Header */}
          <div className="p-5 border-b border-cream-200 flex items-center justify-between bg-cream-50">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-maroon-800 text-gold-400 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-black text-lg text-maroon-950">Your Nizami Feast</h2>
                <p className="text-[11px] text-charcoal-500">
                  {selectedOutlet ? selectedOutlet.name : 'Select outlet before ordering'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-800 hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-cream-100 text-maroon-800 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="font-serif font-bold text-base text-charcoal-800">Your feast is empty</h3>
                <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
                  Add genuine dum biryanis, kebabs, or Nizami desserts from our authentic royal menu.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/orders');
                    }}
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-maroon-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-black transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>View Placed Orders</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isPartyOrder && partyDetails && (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-gold-50 rounded-2xl border border-gold-300 shadow-xs space-y-1 mb-2">
                    <div className="flex items-center space-x-2 text-gold-900 font-extrabold text-xs">
                      <Sparkles className="w-4 h-4 text-gold-600 animate-pulse" />
                      <span>Royal Bulk / Party Feast Configuration</span>
                    </div>
                    <div className="text-[11px] text-charcoal-700 flex flex-wrap gap-x-3 gap-y-1">
                      <span><strong>Guests:</strong> {partyDetails.guestCount} persons</span>
                      <span><strong>Date:</strong> {partyDetails.eventDate}</span>
                      <span><strong>Time:</strong> {partyDetails.eventTime}</span>
                    </div>
                    {partyDetails.specialInstructions && (
                      <div className="text-[10px] text-charcoal-500 italic pt-0.5">
                        "{partyDetails.specialInstructions}"
                      </div>
                    )}
                  </div>
                )}

                {items.map((item, index) => (
                  <div 
                    key={`${item.menuItem.id}-${item.portionSize}-${index}`}
                    className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 flex items-start justify-between space-x-3"
                  >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${item.menuItem.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      <h4 className="font-serif font-bold text-sm text-maroon-950">{item.menuItem.name}</h4>
                    </div>
                    <div className="text-[11px] text-charcoal-500 flex flex-wrap gap-2">
                      <span>{item.portionSize}</span>
                      <span>•</span>
                      <span className="capitalize">{item.spiceLevel.toLowerCase()} spice</span>
                    </div>
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <div className="text-[10px] text-charcoal-600 space-y-0.5 pt-1">
                        {item.selectedAddOns.map((addon) => (
                          <div key={addon.id} className="flex justify-between text-gold-900">
                            <span>+ {addon.name}</span>
                            <span>+₹{addon.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-1 text-xs font-bold text-maroon-900">
                      ₹{item.unitPrice * item.quantity}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2 bg-white rounded-xl border border-cream-200 p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="p-1 text-charcoal-600 hover:text-maroon-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-charcoal-900 px-1">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="p-1 text-charcoal-600 hover:text-maroon-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-charcoal-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              </>
            )}
          </div>

          {/* Checkout Controls */}
          {items.length > 0 && (
            <div className="p-5 bg-cream-50 border-t border-cream-200 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Coupon Code (e.g. HYD100)"
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-cream-200 text-xs focus:ring-2 focus:ring-maroon-800 uppercase font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-gold-500 hover:bg-gold-600 text-charcoal-900 font-bold text-xs rounded-xl shadow-xs"
                  >
                    Apply
                  </button>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Coupon <strong>{couponCode}</strong> applied (-₹{couponDiscount})</span>
                    </span>
                    <button type="button" onClick={removeCoupon} className="text-red-600 hover:underline text-[10px] font-bold">
                      Remove
                    </button>
                  </div>
                )}

                {couponMsg && (
                  <p className={`text-[11px] ${couponMsg.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </form>

              {/* Loyalty Points Redemption */}
              {user && (user.loyaltyPoints || 0) > 0 && (
                <div className="p-3 bg-white rounded-xl border border-gold-300 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center space-x-1 text-gold-900">
                      <Award className="w-4 h-4 text-gold-600" />
                      <span>Redeem Royal Points</span>
                    </span>
                    <span className="text-[11px] text-charcoal-500">Available: {user.loyaltyPoints} pts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min={0}
                      max={Math.min(user.loyaltyPoints || 0, Math.floor(subtotal * 0.5))}
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                      className="flex-1 accent-maroon-800"
                    />
                    <span className="text-xs font-bold text-maroon-900 w-16 text-right">
                      -₹{pointsToRedeem}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 mb-1 uppercase tracking-wider">
                    Delivery Address (Hyderabad)
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-cream-200 text-xs focus:ring-1 focus:ring-maroon-800"
                    placeholder="House/Flat No, Landmark, Area"
                  />
                </div>
              )}

              {/* Real Payment Method: UPI (PhonePe) vs Pay at Counter */}
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Payment Method</span>
                  <span className="text-[10px] text-gold-700 font-bold lowercase tracking-normal">Direct Nizami Gateway</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center space-x-2 transition-all ${
                      paymentMethod === 'UPI'
                        ? 'bg-[#5f259f] text-white border-[#5f259f] shadow-sm'
                        : 'bg-white text-charcoal-700 border-cream-200 hover:border-purple-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-purple-200 flex-shrink-0" />
                    <div className="text-left leading-tight">
                      <div className="font-extrabold">PhonePe UPI</div>
                      <div className="text-[9px] opacity-80">GPay, PhonePe, QR</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center space-x-2 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-maroon-800 text-white border-maroon-800 shadow-sm'
                        : 'bg-white text-charcoal-700 border-cream-200 hover:border-gold-400'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-gold-300 flex-shrink-0" />
                    <div className="text-left leading-tight">
                      <div className="font-extrabold">Pay at Counter</div>
                      <div className="text-[9px] opacity-80">Cash upon pickup</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bill Details */}
              <div className="space-y-1.5 text-xs text-charcoal-700 pt-2 border-t border-cream-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-charcoal-500">
                  <span>GST Included (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                {orderType === 'DELIVERY' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? <strong className="text-emerald-700 font-bold">FREE</strong> : `₹${deliveryFee}`}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-gold-800 font-semibold">
                    <span>Loyalty Points Discount</span>
                    <span>-₹{loyaltyDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-maroon-900 pt-2 border-t border-cream-200">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Place Order CTA */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckout}
                className={`w-full py-3.5 px-4 font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between active:scale-98 disabled:opacity-50 text-white ${
                  paymentMethod === 'UPI'
                    ? 'bg-[#5f259f] hover:bg-[#4d1d82]'
                    : 'bg-gradient-to-r from-maroon-800 to-maroon-950 hover:from-maroon-900 hover:to-black'
                }`}
              >
                <span>
                  {isSubmitting 
                    ? 'Connecting to PhonePe Gateway...' 
                    : paymentMethod === 'UPI' 
                    ? `Pay ₹${totalAmount} via PhonePe UPI` 
                    : 'Place Direct Takeaway Order'}
                </span>
                <div className="flex items-center space-x-1">
                  <span>₹{totalAmount}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PhonePe UPI Payment Modal */}
      {isPhonePeModalOpen && phonePeSession && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-purple-200 animate-in zoom-in-95 duration-200">
            {/* PhonePe Header */}
            <div className="bg-[#5f259f] text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-bold text-[#5f259f] text-xl shadow-xs">
                  पे
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-wide flex items-center gap-1.5">
                    PhonePe Gateway
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </h3>
                  <p className="text-[10px] text-purple-200">Official UPI Standard Checkout</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-purple-200 uppercase font-semibold block">Expires in</span>
                <span className="font-mono font-bold text-xs bg-purple-900/60 px-2 py-0.5 rounded text-gold-300">
                  {formatCountdown(phonePeTimeLeft)}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center space-y-4">
              {phonePeStatus === 'WAITING' && (
                <>
                  <div className="space-y-1">
                    <span className="text-xs text-charcoal-500 font-semibold">Payable to Hyderabad House</span>
                    <div className="text-3xl font-black text-[#5f259f]">
                      ₹{phonePeSession.amount}
                    </div>
                    <p className="text-[11px] text-charcoal-400">
                      Ref: <span className="font-mono">{phonePeSession.merchantTransactionId}</span>
                    </p>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="p-4 bg-cream-50 rounded-2xl border border-purple-100 inline-block shadow-inner">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(phonePeSession.qrString || phonePeSession.redirectUrl)}`} 
                      alt="PhonePe UPI QR Code"
                      className="w-44 h-44 rounded-xl mx-auto shadow-xs border border-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-charcoal-800 flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#5f259f]" />
                      Scan with PhonePe, Google Pay, Paytm, or BHIM
                    </p>
                    <p className="text-[11px] text-charcoal-500">
                      Waiting for bank confirmation... Live updating
                    </p>
                  </div>

                  {/* Testing sandbox buttons */}
                  <div className="pt-2 border-t border-cream-200 space-y-2">
                    <div className="bg-purple-50 p-2 rounded-xl text-[10px] text-purple-900 border border-purple-200">
                      <strong>UAT Testing Sandbox:</strong> You can simulate payment completion or open the mock gateway.
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isSimulating}
                        onClick={() => handleSimulatePayment('SUCCESS')}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Simulate Success</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSimulating}
                        onClick={() => handleSimulatePayment('FAIL')}
                        className="py-2.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-xs"
                      >
                        Simulate Fail
                      </button>
                    </div>

                    <a
                      href={phonePeSession.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1 text-xs text-[#5f259f] font-bold hover:underline pt-1"
                    >
                      <span>Open PhonePe Sandbox Browser Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </>
              )}

              {phonePeStatus === 'SUCCESS' && (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif font-black text-xl text-maroon-950">Payment Successful!</h3>
                  <p className="text-xs text-charcoal-600 font-medium">
                    Transaction verified by PhonePe. Routing order to outlet kitchen...
                  </p>
                </div>
              )}

              {phonePeStatus === 'FAILED' && (
                <div className="py-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-red-950">Payment Failed or Cancelled</h3>
                  <p className="text-xs text-charcoal-500">
                    Your account was not debited. Cart items remain saved for your next attempt.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhonePeModalOpen(false);
                      setPhonePeSession(null);
                    }}
                    className="w-full py-2.5 bg-charcoal-900 text-white rounded-xl font-bold text-xs"
                  >
                    Return to Cart
                  </button>
                </div>
              )}

              {phonePeStatus === 'WAITING' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPhonePeModalOpen(false);
                    setPhonePeSession(null);
                    setErrorMsg('Payment cancelled. Your cart items are preserved.');
                  }}
                  className="w-full py-2 text-xs text-charcoal-400 hover:text-charcoal-700 font-medium"
                >
                  Cancel and choose another method
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDrawer;
