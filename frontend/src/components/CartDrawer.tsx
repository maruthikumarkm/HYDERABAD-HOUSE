import React, { useState } from 'react';
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
  CreditCard, 
  Smartphone, 
  Banknote,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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
    setOrderType
  } = useCart();

  const { user, isAuthenticated, updateLoyaltyPoints } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Royal Palms, Botanical Garden Road, Kondapur, Hyderabad');
  const [customerName, setCustomerName] = useState(user?.name || 'Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+919876543210');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    try {
      const payload = {
        outletId: selectedOutlet.id,
        orderType,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : 'Takeaway Counter',
        customerName: user?.name || customerName,
        customerPhone: user?.phone || customerPhone,
        specialInstructions,
        couponCode: couponDiscount > 0 ? couponCode : null,
        pointsToRedeem,
        paymentMethod,
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

      const res = await api.post('/orders/create', payload);
      const createdOrder = res.data;

      // Celebrate with confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Clear cart
      clearCart();
      setIsCartOpen(false);

      // Refresh loyalty points
      if (user?.loyaltyPoints !== undefined) {
        updateLoyaltyPoints(user.loyaltyPoints - pointsToRedeem + Math.floor(createdOrder.totalAmount * 0.1));
      }

      // Navigate directly to real-time order tracking!
      navigate(`/track/${createdOrder.orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to place order. Please check item availability.');
    } finally {
      setIsSubmitting(false);
    }
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
                <h3 className="font-serif font-bold text-base text-maroon-900">Your Royal Cart</h3>
                <p className="text-xs text-charcoal-600">
                  {selectedOutlet ? selectedOutlet.name.replace('Hyderabad House - ', '') : 'Select Outlet'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-cream-200 text-charcoal-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery / Takeaway Toggle */}
          <div className="px-5 py-2.5 bg-cream-100/70 border-b border-cream-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-700">Order Mode:</span>
            <div className="flex bg-white p-0.5 rounded-lg border border-cream-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`px-3 py-1 rounded-md transition-all ${
                  orderType === 'DELIVERY' ? 'bg-maroon-800 text-white' : 'text-charcoal-700'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setOrderType('PICKUP')}
                className={`px-3 py-1 rounded-md transition-all ${
                  orderType === 'PICKUP' ? 'bg-maroon-800 text-white' : 'text-charcoal-700'
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="p-5 overflow-y-auto flex-1 divide-y divide-cream-100">
            {items.length === 0 ? (
              <div className="py-16 text-center text-charcoal-500 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto text-cream-300" />
                <p className="text-sm font-medium">Your cart is empty</p>
                <p className="text-xs text-charcoal-400 max-w-xs mx-auto">
                  Add some aromatic dum biryani, kebabs, or double ka meetha to begin!
                </p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="py-3.5 first:pt-0 flex items-start justify-between space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.menuItem.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      <h4 className="font-serif font-bold text-xs text-charcoal-900">{item.menuItem.name}</h4>
                    </div>

                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      {item.portionSize} • {item.spiceLevel}
                    </p>

                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedAddOns.map((addon) => (
                          <span key={addon.id} className="text-[10px] bg-gold-50 text-gold-900 border border-gold-200 px-1.5 py-0.5 rounded">
                            +{addon.name} (₹{addon.price})
                          </span>
                        ))}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <p className="text-[10px] text-maroon-800 italic mt-0.5">"{item.specialInstructions}"</p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-maroon-900">₹{item.totalPrice}</span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center space-x-2 bg-cream-50 px-2 py-1 rounded-lg border border-cream-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-0.5 text-charcoal-600 hover:text-maroon-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="p-0.5 text-charcoal-600 hover:text-maroon-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1 text-charcoal-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Controls (only if items present) */}
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

              {/* Loyalty Points Redemption (if logged in and has points) */}
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

              {/* Delivery Address (for Delivery) */}
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

              {/* Mock Payment Method Selection */}
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1.5 uppercase tracking-wider">
                  Test Mock Payment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI (GPay/PhonePe)', icon: Smartphone },
                    { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'CASH', label: 'Pay at Counter', icon: Banknote },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                        paymentMethod === m.id
                          ? 'bg-maroon-800 text-white border-maroon-800 shadow-xs'
                          : 'bg-white text-charcoal-700 border-cream-200 hover:border-gold-400'
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      <span className="truncate w-full text-center">{m.id}</span>
                    </button>
                  ))}
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
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Place Order CTA */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-maroon-800 to-maroon-950 hover:from-maroon-900 hover:to-black text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between active:scale-98 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Processing Order...' : 'Place Direct Order'}</span>
                <div className="flex items-center space-x-1">
                  <span>₹{totalAmount}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
