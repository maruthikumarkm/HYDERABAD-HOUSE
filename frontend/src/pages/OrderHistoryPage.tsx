import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, RotateCcw, ChevronRight, MapPin, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=history');
      return;
    }

    setLoading(true);
    api.get('/orders/my-orders')
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

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

  return (
    <div className="min-h-screen py-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="font-serif font-black text-2xl text-maroon-950">Your Past Orders</h1>
          <p className="text-xs text-charcoal-500">Track and re-order your favorite Hyderabad House delicacies with one click</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-charcoal-400">Total Placed:</span>
          <span className="font-bold text-sm block text-maroon-900">{orders.length} Orders</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-charcoal-500">
          <div className="w-8 h-8 border-4 border-maroon-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Fetching your order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-charcoal-500 bg-white rounded-3xl border border-cream-200 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-cream-300 mx-auto" />
          <h3 className="font-serif font-bold text-base text-charcoal-800">No past orders yet</h3>
          <p className="text-xs text-charcoal-400">Explore our authentic dum biryani selection and place your first direct order.</p>
          <Link
            to="/#menu"
            className="inline-block py-2.5 px-6 bg-maroon-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-black"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cream-100 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-maroon-900">{o.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      o.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                      o.status === 'READY_FOR_PICKUP' ? 'bg-green-100 text-green-800' : 'bg-cream-200 text-charcoal-800'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-charcoal-500 block mt-0.5">
                    {new Date(o.placedAt).toLocaleString()} • {o.outlet.name}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-base font-black text-maroon-950">₹{o.totalAmount}</span>
                  <Link
                    to={`/track/${o.orderNumber}`}
                    className="p-2 text-charcoal-400 hover:text-maroon-900 transition-colors"
                    title="Live Track"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Items in Order */}
              <div className="space-y-1.5 text-xs text-charcoal-700">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.itemName} × {it.quantity} ({it.portionSize})</span>
                    <span className="font-semibold text-charcoal-800">₹{it.totalPrice}</span>
                  </div>
                ))}
              </div>

              {/* Reorder Button */}
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
      )}
    </div>
  );
};

export default OrderHistoryPage;
