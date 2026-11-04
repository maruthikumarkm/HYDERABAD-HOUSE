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
  Search
} from 'lucide-react';
import { Order, OrderStatusHistory } from '../types';
import { useCart } from '../context/CartContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber: paramOrderNumber } = useParams<{ orderNumber?: string }>();
  const [orderNumberInput, setOrderNumberInput] = useState(paramOrderNumber || 'WEB-778120');
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const { addItem, clearCart } = useCart();
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
      setError('Order not found. Please verify your order number (e.g. WEB-778120).');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramOrderNumber) {
      setOrderNumberInput(paramOrderNumber);
      fetchOrder(paramOrderNumber);
    } else {
      fetchOrder('WEB-778120'); // Demo preserved sample order
    }
  }, [paramOrderNumber]);

  // Live WebSocket subscription for immediate updates without refresh!
  useEffect(() => {
    if (order?.orderNumber) {
      const topic = `/topic/orders/${order.orderNumber}`;
      wsService.subscribe(topic, (updatedOrderPayload: any) => {
        console.log('[Live Tracking WS] Received update for order:', updatedOrderPayload);
        // Refresh full order with history
        fetchOrder(order.orderNumber);
      });

      return () => {
        wsService.unsubscribe(topic);
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
    { key: 'RIDER_HANDOFF', label: 'On The Way', icon: Bike },
    { key: 'COMPLETED', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    const idx = steps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
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
              placeholder="e.g. WEB-778120"
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
                  {order.status === 'COMPLETED' ? 'Order Fulfilled & Delivered' :
                   order.status === 'READY_FOR_PICKUP' ? 'Packed & Hot at Counter' :
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
