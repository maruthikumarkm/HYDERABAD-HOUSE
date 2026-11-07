import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Clock, 
  RotateCcw, 
  ChevronRight, 
  MapPin, 
  CheckCircle2, 
  Flame, 
  ChefHat, 
  Bike,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch order history', err);
      if (!silent) {
        setError('Could not fetch orders. Please ensure you are logged in.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=orders');
      return;
    }

    fetchOrders(false);

    // Auto-poll orders every 5 seconds for live status updates from kitchen
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isAuthenticated]);

  // Subscribe to WebSocket updates for each active order
  useEffect(() => {
    const activeOrders = orders.filter((o) => 
      ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_HANDOFF'].includes(o.status)
    );

    activeOrders.forEach((order) => {
      const topic = `/topic/orders/${order.orderNumber}`;
      wsService.subscribe(topic, () => {
        fetchOrders(true);
      });
    });

    return () => {
      activeOrders.forEach((order) => {
        wsService.unsubscribe(`/topic/orders/${order.orderNumber}`);
      });
    };
  }, [orders]);

  const handleReorder = (order: Order) => {
    clearCart();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
            Placed
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Confirmed
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <ChefHat className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
            Preparing (Dum)
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
            Ready for Pickup
          </span>
        );
      case 'RIDER_HANDOFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <Bike className="w-3.5 h-3.5 text-indigo-600" />
            On the Way
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cream-200 text-charcoal-800">
            {status}
          </span>
        );
    }
  };

  const activeOrders = orders.filter((o) => 
    ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_HANDOFF'].includes(o.status)
  );
  const pastOrders = orders.filter((o) => 
    !['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_HANDOFF'].includes(o.status)
  );

  return (
    <div className="min-h-screen py-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
            Direct Orders
          </span>
          <h1 className="font-serif font-black text-2xl text-maroon-950 mt-1">
            My Orders
          </h1>
          <p className="text-xs text-charcoal-500">
            Real-time live kitchen preparation status and order history for {user?.name || 'Customer'}
          </p>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="text-xs text-charcoal-500 font-semibold">Total Orders:</span>
          <span className="font-mono font-bold text-sm bg-cream-100 text-maroon-900 px-3 py-1 rounded-xl border border-cream-200">
            {orders.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-charcoal-500">
          <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Retrieving your orders from database...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-medium text-center">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-charcoal-500 bg-white rounded-3xl border border-cream-200 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-cream-300 mx-auto" />
          <h3 className="font-serif font-bold text-base text-charcoal-800">No orders yet</h3>
          <p className="text-xs text-charcoal-400 max-w-sm mx-auto">
            You haven't placed any biryani feasts yet. Browse our genuine Nizami menu and enjoy direct ordering.
          </p>
          <Link
            to="/#menu"
            className="inline-block py-2.5 px-6 bg-maroon-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-black"
          >
            Browse Authentic Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="font-serif font-bold text-base text-maroon-950">
                  Active Orders ({activeOrders.length})
                </h2>
              </div>

              <div className="space-y-4">
                {activeOrders.map((o) => (
                  <div 
                    key={o.id} 
                    className="bg-white p-6 rounded-3xl border-2 border-gold-400 shadow-md space-y-4 relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cream-100 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-sm text-maroon-900 bg-cream-100 px-2.5 py-0.5 rounded-lg border border-cream-200">
                            {o.orderNumber}
                          </span>
                          {getStatusBadge(o.status)}
                        </div>
                        <span className="text-[11px] text-charcoal-500 block mt-1">
                          {new Date(o.placedAt).toLocaleString()} • {o.outlet?.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-base font-black text-maroon-950">₹{o.totalAmount}</span>
                        <Link
                          to={`/track/${o.orderNumber}`}
                          className="py-1.5 px-3.5 bg-maroon-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition-all shadow-xs"
                        >
                          <span>Live Track</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 text-xs text-charcoal-700">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="font-medium text-charcoal-800">
                            {it.itemName} × {it.quantity} ({it.portionSize})
                          </span>
                          <span className="font-semibold text-charcoal-900">₹{it.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-[11px] text-charcoal-500 bg-cream-50 p-2.5 rounded-xl border border-cream-200 flex items-center justify-between">
                      <span>Delivery: {o.deliveryAddress || 'Takeaway Counter'}</span>
                      <span className="font-bold text-maroon-900">Status: {o.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Orders Section */}
          {pastOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-base text-maroon-950">
                Completed & Past Orders ({pastOrders.length})
              </h2>

              <div className="space-y-4">
                {pastOrders.map((o) => (
                  <div 
                    key={o.id} 
                    className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cream-100 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-charcoal-800">{o.orderNumber}</span>
                          {getStatusBadge(o.status)}
                        </div>
                        <span className="text-[11px] text-charcoal-500 block mt-0.5">
                          {new Date(o.placedAt).toLocaleString()} • {o.outlet?.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-base font-black text-maroon-950">₹{o.totalAmount}</span>
                        <Link
                          to={`/track/${o.orderNumber}`}
                          className="p-2 text-charcoal-400 hover:text-maroon-900 transition-colors"
                          title="View Details"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-charcoal-700">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.itemName} × {it.quantity} ({it.portionSize})</span>
                          <span className="font-semibold text-charcoal-800">₹{it.totalPrice}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleReorder(o)}
                        className="py-2 px-4 bg-cream-100 hover:bg-gold-500 text-charcoal-900 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-cream-300"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-maroon-900" />
                        <span>Re-order These Items</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
