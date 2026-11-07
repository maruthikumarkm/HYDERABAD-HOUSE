import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  ChefHat, 
  Bike, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck,
  ChevronRight,
  Flame,
  Search,
  Phone,
  Sparkles
} from 'lucide-react';
import { Order, OrderStatusHistory } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber?: string }>();
  const [orderNumberInput, setOrderNumberInput] = useState(paramOrderNumber || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const { addItem, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchOrder = async (num: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${num}`);
      setOrder(res.data.order);
      setHistory(res.data.history || []);

      // Calculate remaining countdown
      if (res.data.order?.estimatedReadyTime) {
        const diffMs = new Date(res.data.order.estimatedReadyTime).getTime() - new Date().getTime();
        setRemainingSeconds(Math.max(0, Math.floor(diffMs / 1000)));
      }
    } catch (err: any) {
      setError(`Order ${num} not found. Please verify your order number.`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramOrderNumber && paramOrderNumber.trim()) {
      setOrderNumberInput(paramOrderNumber.trim());
      fetchOrder(paramOrderNumber.trim());
    } else if (isAuthenticated) {
      // Auto-fetch customer orders and default to latest active order!
      api.get('/orders/my-orders')
        .then((res) => {
          const list: Order[] = res.data || [];
          setUserOrders(list);
          if (list.length > 0) {
            const active = list.find((o) => 
              ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_HANDOFF'].includes(o.status)
            ) || list[0];
            setOrderNumberInput(active.orderNumber);
            fetchOrder(active.orderNumber);
          } else {
            setOrder(null);
            setHistory([]);
            setError(null);
          }
        })
        .catch(() => {
          setOrder(null);
          setHistory([]);
          setError(null);
        });
    } else {
      setOrder(null);
      setHistory([]);
      setError(null);
    }
  }, [paramOrderNumber, isAuthenticated]);

  // Live WebSocket subscription for immediate updates without refresh!
  useEffect(() => {
    if (order?.orderNumber) {
      const topic = `/topic/orders/${order.orderNumber}`;
      wsService.subscribe(topic, (updatedOrderPayload: any) => {
        console.log('[Live Tracking WS] Received update for order:', updatedOrderPayload);
        fetchOrder(order.orderNumber);
      });

      // Also 5-second polling fallback so status always advances live
      const poll = setInterval(() => {
        api.get(`/orders/${order.orderNumber}`)
          .then((res) => {
            setOrder(res.data.order);
            setHistory(res.data.history || []);
          })
          .catch(() => {});
      }, 5000);

      return () => {
        wsService.unsubscribe(topic);
        clearInterval(poll);
      };
    }
  }, [order?.orderNumber]);

  // Live countdown ticker
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumberInput.trim()) {
      navigate(`/track/${orderNumberInput.trim().toUpperCase()}`);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    clearCart();
    // Add all items to cart
    order.items.forEach((item: any) => {
      addItem(
        {
          id: item.menuItemId || item.id,
          name: item.itemName,
          basePrice: item.unitPrice,
          price: item.unitPrice,
          portionSize: item.portionSize,
          isVeg: false,
          spiceLevel: item.spiceLevel || 'MEDIUM',
          prepTimeMinutes: 20,
          categoryId: 1,
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
        },
        item.quantity,
        item.portionSize,
        item.spiceLevel || 'MEDIUM',
        []
      );
    });
    navigate('/#menu');
  };

  const steps = [
    { key: 'PLACED', label: 'Placed', icon: ShoppingBag },
    { key: 'CONFIRMED', label: 'Accepted', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Dum Prep', icon: ChefHat },
    { key: 'READY_FOR_PICKUP', label: 'Packed & Ready', icon: Flame },
    { key: 'ASSIGNED', label: 'Rider Assigned', icon: Bike },
    { key: 'PICKED_UP', label: 'Picked Up', icon: Bike },
    { key: 'OUT_FOR_DELIVERY', label: 'On Route', icon: Bike },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'CONFIRMED': return 1;
      case 'PREPARING': return 2;
      case 'READY':
      case 'READY_FOR_PICKUP': return 3;
      case 'ASSIGNED':
      case 'ACCEPTED': return 4;
      case 'PICKED_UP': return 5;
      case 'OUT_FOR_DELIVERY':
      case 'RIDER_HANDOFF': return 6;
      case 'DELIVERED':
      case 'COMPLETED': return 7;
      default: return 0;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen py-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-black text-xl text-maroon-950">Live Kitchen Tracking</h1>
          <p className="text-xs text-charcoal-500">Real-time status updates via WebSocket directly from outlet kitchen</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-3" />
            <input
              type="text"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              placeholder="Enter Order # (e.g. WEB-123456)"
              className="w-full pl-8 pr-3 py-2 bg-cream-50 rounded-xl border border-cream-200 text-xs font-bold uppercase focus:ring-2 focus:ring-maroon-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-maroon-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-black"
          >
            Track
          </button>
        </form>
      </div>

      {/* Multiple Orders Quick Switcher for Customer */}
      {userOrders.length > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-cream-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-charcoal-500 font-bold text-[11px] uppercase tracking-wider flex-shrink-0">
            Your Orders:
          </span>
          <div className="flex gap-2">
            {userOrders.map((uo) => (
              <button
                key={uo.id}
                type="button"
                onClick={() => {
                  setOrderNumberInput(uo.orderNumber);
                  navigate(`/track/${uo.orderNumber}`);
                }}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                  order?.orderNumber === uo.orderNumber
                    ? 'bg-maroon-900 text-white shadow-xs'
                    : 'bg-cream-100 hover:bg-cream-200 text-charcoal-800'
                }`}
              >
                <span>{uo.orderNumber}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase ${
                  order?.orderNumber === uo.orderNumber ? 'bg-white/20 text-white' : 'bg-cream-300 text-charcoal-700'
                }`}>
                  {uo.status.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!order && !loading && !error && (
        <div className="bg-white p-12 rounded-3xl border border-cream-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto text-maroon-900 border border-cream-200">
            <Search className="w-8 h-8 text-gold-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="font-serif font-black text-xl text-maroon-950">Track Your Order in Real Time</h2>
            <p className="text-xs text-charcoal-500">
              Enter your order confirmation number above to monitor live preparation stages, dum cooking time, and rider handoff directly from the outlet kitchen.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-20 text-center text-charcoal-500">
          <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Connecting to outlet kitchen display...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-medium text-center">
          {error}
        </div>
      )}

      {order && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Status & Countdown Banner */}
          <div className="bg-gradient-to-br from-maroon-950 to-maroon-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gold-500/30 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono uppercase bg-gold-500 text-charcoal-900 px-2 py-0.5 rounded font-black tracking-wider">
                    {order.orderNumber}
                  </span>
                  <span className="text-xs text-gold-300">
                    {order.orderType === 'DELIVERY' ? 'Doorstep Delivery' : 'Express Takeaway'}
                  </span>
                </div>

                <h2 className="font-serif font-black text-2xl sm:text-3xl mt-2 text-white">
                  {order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'Feast Delivered & Enjoyed' :
                   order.status === 'OUT_FOR_DELIVERY' ? 'Rider is Out for Delivery' :
                   order.status === 'PICKED_UP' ? 'Rider Picked Up Order from Kitchen' :
                   order.status === 'ASSIGNED' || order.status === 'ACCEPTED' ? 'Delivery Partner Assigned & En Route' :
                   order.status === 'READY_FOR_PICKUP' || order.status === 'READY' ? 'Packed Hot & Ready at Outlet' :
                   order.status === 'PREPARING' ? 'Slow Dum Preparation Active' :
                   order.status === 'CONFIRMED' ? 'Order Accepted by Kitchen' : 'Order Placed with Kitchen'}
                </h2>

                <p className="text-xs text-cream-300 mt-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>Preparing at: <strong>{order.outlet.name}</strong></span>
                </p>
              </div>

              {/* Live Countdown Clock */}
              {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center sm:text-right flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-gold-400 tracking-widest flex items-center justify-center sm:justify-end space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Estimated Ready Time</span>
                  </span>
                  <div className="text-3xl font-mono font-black text-white mt-0.5">
                    {formatTimer(remainingSeconds)}
                  </div>
                  <span className="text-[10px] text-cream-400">
                    Promised: {order.promisedPrepTimeMinutes} mins
                  </span>
                </div>
              )}
            </div>

            {/* Late Alert Banner if Delayed */}
            {order.isLate && (
              <div className="mt-5 p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center space-x-3 text-xs text-red-200">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <strong className="text-white">Nizami Dum Perfection in Progress:</strong>
                  <span> Your dum handi requires 4-5 additional minutes for the authentic saffron infusion. Our chef is personally overseeing your pack.</span>
                </div>
              </div>
            )}
          </div>

          {/* Visual Step Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-sm">
            <h3 className="font-serif font-bold text-sm text-charcoal-900 uppercase tracking-wider mb-6">
              Live Preparation Timeline
            </h3>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-4 right-4 h-1 bg-cream-200 -z-0">
                <div 
                  className="h-1 bg-gradient-to-r from-maroon-800 to-gold-500 transition-all duration-700" 
                  style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Step Icons */}
              <div className="flex items-start justify-between relative z-10">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center max-w-[80px]">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? 'bg-maroon-900 border-gold-400 text-gold-300 shadow-md'
                            : 'bg-white border-cream-300 text-charcoal-400'
                        } ${isCurrent ? 'ring-4 ring-gold-400/30 scale-110' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] font-bold mt-2 ${isDone ? 'text-maroon-950' : 'text-charcoal-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Party Banquet Feast Banner if applicable */}
          {(order.orderType === 'PARTY_BULK' || order.partyDetails) && (
            <div className="bg-gradient-to-r from-amber-50 to-gold-50 p-5 rounded-3xl border border-gold-300 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-gold-600 text-charcoal-950 rounded-2xl shadow-xs">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-serif font-black text-base text-maroon-950 block">Royal Bulk & Party Feast</span>
                  <span className="text-xs text-charcoal-600">
                    {order.partyDetails?.guestCount || 25} Guests • Event: {order.partyDetails?.eventDate || 'Confirmed'} at {order.partyDetails?.eventTime || '19:30'}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-900 border border-amber-400 font-bold text-xs rounded-xl">
                Bulk Deg Dum
              </span>
            </div>
          )}

          {/* Assigned Delivery Partner Card */}
          {order.deliveryStaff && (
            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Bike className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                    Assigned Delivery Partner ({order.status.replace('_', ' ')})
                  </span>
                  <span className="font-serif font-black text-base text-charcoal-950 block">
                    {order.deliveryStaff.name}
                  </span>
                  <span className="text-xs text-charcoal-500 font-mono">
                    {order.deliveryStaff.phone}
                  </span>
                </div>
              </div>

              <a
                href={`tel:${order.deliveryStaff.phone}`}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Rider</span>
              </a>
            </div>
          )}

          {/* Order Details & Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Items List */}
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-sm text-maroon-950 uppercase tracking-wider border-b border-cream-100 pb-2">
                Dishes in this Order
              </h4>
              <div className="divide-y divide-cream-100 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-2 flex items-start justify-between">
                    <div>
                      <h5 className="font-serif font-bold text-xs text-charcoal-900">
                        {item.itemName} × {item.quantity}
                      </h5>
                      <p className="text-[11px] text-charcoal-500">
                        {item.portionSize} • {item.spiceLevel}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-[10px] text-maroon-800 italic">"{item.specialInstructions}"</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-maroon-900">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-cream-100 flex items-center justify-between text-sm font-black text-charcoal-900">
                <span>Total Paid ({order.paymentMethod})</span>
                <span className="text-maroon-900 text-base">₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Delivery Info & Re-order */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-sm text-maroon-950 uppercase tracking-wider border-b border-cream-100 pb-2">
                  Delivery & Contact
                </h4>
                <div className="space-y-2 text-xs text-charcoal-700 mt-3">
                  <p><strong>Customer:</strong> {order.customerName} ({order.customerPhone})</p>
                  <p><strong>Address:</strong> {order.deliveryAddress || 'Takeaway Counter'}</p>
                  <p><strong>Payment Status:</strong> <span className="text-emerald-700 font-bold uppercase">{order.paymentStatus}</span></p>
                  <p><strong>Placed At:</strong> {new Date(order.placedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* 1-Click Reorder Button */}
              <button
                type="button"
                onClick={handleReorder}
                className="w-full py-3 px-4 bg-cream-100 hover:bg-gold-500 text-charcoal-900 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 border border-cream-300"
              >
                <RotateCcw className="w-4 h-4 text-maroon-900" />
                <span>Re-order These Items</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
