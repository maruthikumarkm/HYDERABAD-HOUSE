import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Navigation, 
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChefHat,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availability, setAvailability] = useState<string>('AVAILABLE');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED'>('ASSIGNED');

  // Sound alert
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioContext not permitted yet
    }
  };

  const loadDeliveryOrders = async () => {
    try {
      const res = await api.get('/delivery/orders');
      setOrders(res.data);
    } catch (err: any) {
      console.error('Failed to load delivery orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryOrders();

    if (user?.id) {
      const topic = `/topic/delivery/${user.id}`;
      wsService.subscribe(topic, (incoming: any) => {
        console.log('[Delivery WS] Incoming order update:', incoming);
        playAlertSound();
        loadDeliveryOrders();
      });

      // 5-second polling fallback
      const poll = setInterval(() => {
        loadDeliveryOrders();
      }, 5000);

      return () => {
        wsService.unsubscribe(topic);
        clearInterval(poll);
      };
    }
  }, [user?.id]);

  const handleToggleAvailability = async (nextStatus: string) => {
    try {
      const res = await api.patch('/delivery/availability', { status: nextStatus });
      setAvailability(res.data.status);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update shift availability');
    }
  };

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    setActionLoading(orderId);
    setErrorMsg(null);
    try {
      await api.patch(`/delivery/orders/${orderId}/status`, { status: nextStatus });
      if (nextStatus === 'DELIVERED') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      await loadDeliveryOrders();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || `Failed to transition order to ${nextStatus}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Group orders
  const assignedOrders = orders.filter((o) => o.status === 'ASSIGNED');
  const inTransitOrders = orders.filter((o) => 
    o.status === 'ACCEPTED' || o.status === 'PICKED_UP' || o.status === 'OUT_FOR_DELIVERY'
  );
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-charcoal-950 text-white p-4 sm:p-6 space-y-6">
      {/* Top Rider Header */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center border border-emerald-400 shadow-md">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-black text-xl tracking-wider text-white">
                RIDER DISPATCH CONSOLE
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold uppercase">
                Active Shift
              </span>
            </div>
            <p className="text-xs text-cream-300">
              Delivery Partner: <strong className="text-gold-400">{user?.name}</strong> • Phone: {user?.phone || '+91 98765 00000'}
            </p>
          </div>
        </div>

        {/* Availability Status Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="bg-charcoal-800 p-1 rounded-2xl border border-charcoal-700 flex space-x-1">
            {[
              { id: 'AVAILABLE', label: 'Available', color: 'bg-emerald-600 text-white' },
              { id: 'BUSY', label: 'Busy (On Route)', color: 'bg-amber-600 text-white' },
              { id: 'OFFLINE', label: 'Off Duty', color: 'bg-charcoal-700 text-cream-300' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleToggleAvailability(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  availability === st.id ? `${st.color} shadow-md` : 'text-charcoal-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadDeliveryOrders}
            className="p-2.5 bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-cream-200 rounded-xl"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-charcoal-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ASSIGNED')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ASSIGNED'
              ? 'bg-amber-500 text-charcoal-950 shadow-md'
              : 'bg-charcoal-900 text-charcoal-400 hover:text-white'
          }`}
        >
          <span>1. New Assignments</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-amber-300">
            {assignedOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IN_TRANSIT')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'IN_TRANSIT'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-charcoal-900 text-charcoal-400 hover:text-white'
          }`}
        >
          <span>2. Active Deliveries</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-emerald-200">
            {inTransitOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-charcoal-700 text-white shadow-md'
              : 'bg-charcoal-900 text-charcoal-400 hover:text-white'
          }`}
        >
          <span>3. Delivered Today</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-cream-300">
            {completedOrders.length}
          </span>
        </button>
      </div>

      {/* Tab 1: ASSIGNED (Needs Acceptance) */}
      {activeTab === 'ASSIGNED' && (
        <div className="space-y-4">
          {assignedOrders.length === 0 ? (
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-12 text-center space-y-3">
              <Bike className="w-12 h-12 text-charcoal-600 mx-auto" />
              <h3 className="font-serif font-bold text-base text-cream-200">No New Assignments</h3>
              <p className="text-xs text-charcoal-400 max-w-sm mx-auto">
                Orders assigned by the Outlet Manager when the kitchen finishes dum preparation will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {assignedOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  actionLoading={actionLoading === order.id}
                  actionButton={
                    <button
                      type="button"
                      disabled={actionLoading === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Delivery Order</span>
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: IN TRANSIT (Accepted -> Picked Up -> Out for Delivery -> Delivered) */}
      {activeTab === 'IN_TRANSIT' && (
        <div className="space-y-4">
          {inTransitOrders.length === 0 ? (
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-12 text-center space-y-3">
              <Navigation className="w-12 h-12 text-charcoal-600 mx-auto" />
              <h3 className="font-serif font-bold text-base text-cream-200">No Active Deliveries on Road</h3>
              <p className="text-xs text-charcoal-400 max-w-sm mx-auto">
                Accept incoming orders in Tab 1 to start pickup and transit.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inTransitOrders.map((order) => {
                let actionBtn = null;

                if (order.status === 'ACCEPTED') {
                  actionBtn = (
                    <button
                      type="button"
                      disabled={actionLoading === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <ChefHat className="w-4 h-4 text-gold-300" />
                      <span>Arrived at Kitchen & Mark Picked Up</span>
                    </button>
                  );
                } else if (order.status === 'PICKED_UP') {
                  actionBtn = (
                    <button
                      type="button"
                      disabled={actionLoading === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <Navigation className="w-4 h-4 text-gold-300" />
                      <span>Start Route (Out for Delivery)</span>
                    </button>
                  );
                } else if (order.status === 'OUT_FOR_DELIVERY') {
                  actionBtn = (
                    <button
                      type="button"
                      disabled={actionLoading === order.id}
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Mark Feast Delivered to Customer</span>
                    </button>
                  );
                }

                return (
                  <DeliveryOrderCard
                    key={order.id}
                    order={order}
                    actionLoading={actionLoading === order.id}
                    actionButton={actionBtn}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: COMPLETED */}
      {activeTab === 'COMPLETED' && (
        <div className="space-y-4">
          {completedOrders.length === 0 ? (
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-charcoal-600 mx-auto" />
              <h3 className="font-serif font-bold text-base text-cream-200">No Orders Delivered Yet</h3>
              <p className="text-xs text-charcoal-400">Completed deliveries for today will be logged here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  actionLoading={false}
                  actionButton={
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Delivered Successfully</span>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DeliveryOrderCardProps {
  order: Order;
  actionButton: React.ReactNode;
  actionLoading: boolean;
}

const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({ order, actionButton, actionLoading }) => {
  const isParty = order.orderType === 'PARTY_BULK' || Boolean(order.partyDetails);

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
      {/* Top Banner if Party Feast */}
      {isParty && (
        <div className="bg-gradient-to-r from-amber-600 to-gold-600 text-charcoal-950 px-3.5 py-1.5 -mx-5 -mt-5 mb-1 flex items-center justify-between text-xs font-black uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Royal Bulk / Banquet Feast</span>
          </div>
          <span className="bg-black/30 text-white px-2 py-0.5 rounded-full text-[10px]">
            {order.partyDetails?.guestCount || '25+'} Guests
          </span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-base font-mono font-black text-gold-300 tracking-wider">
            {order.orderNumber}
          </span>
          <div className="text-[11px] text-charcoal-400 flex items-center space-x-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-gold-500" />
            <span>Placed: {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-black text-white px-2.5 py-1 bg-charcoal-800 rounded-xl border border-charcoal-700">
            ₹{order.totalAmount}
          </span>
          <span className="block mt-1 text-[10px] font-bold text-emerald-400 uppercase">
            {order.paymentStatus || 'PAID'} • {order.paymentMethod}
          </span>
        </div>
      </div>

      {/* Pickup Outlet Location */}
      <div className="bg-charcoal-950/80 p-3 rounded-2xl border border-charcoal-800 text-xs space-y-1">
        <div className="flex items-center space-x-1.5 text-cream-300 font-bold">
          <ChefHat className="w-3.5 h-3.5 text-gold-400" />
          <span>Pickup Hub: {order.outlet?.name || 'Hyderabad House - Kondapur'}</span>
        </div>
        <p className="text-[11px] text-charcoal-400 pl-5">
          {order.outlet?.address || 'Botanical Garden Road, Kondapur, Hyderabad'}
        </p>
      </div>

      {/* Customer Delivery Details */}
      <div className="bg-charcoal-950/80 p-3.5 rounded-2xl border border-charcoal-800 space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-charcoal-800/80 pb-2">
          <div>
            <span className="font-bold text-white text-sm block">{order.customerName}</span>
            <a 
              href={`tel:${order.customerPhone}`}
              className="text-[11px] text-gold-400 hover:underline flex items-center space-x-1 mt-0.5 font-mono"
            >
              <Phone className="w-3 h-3" />
              <span>{order.customerPhone}</span>
            </a>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress || 'Kondapur, Hyderabad')}`}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-cream-200 rounded-xl font-bold text-[11px] flex items-center space-x-1 border border-charcoal-700"
          >
            <Navigation className="w-3 h-3 text-gold-400" />
            <span>Map</span>
          </a>
        </div>

        <div className="flex items-start space-x-1.5 text-cream-200">
          <MapPin className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
          <span className="text-[11px] leading-relaxed">
            {order.deliveryAddress || 'Kondapur, Hyderabad'}
          </span>
        </div>

        {order.specialInstructions && (
          <div className="p-2 bg-maroon-950/40 rounded-xl border border-maroon-800/40 text-[11px] text-gold-300 italic">
            <strong>Notes:</strong> {order.specialInstructions}
          </div>
        )}
      </div>

      {/* Food Items List */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-400 block">
          Order Items ({order.items?.length || 0}):
        </span>
        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs bg-charcoal-950/40 px-2.5 py-1 rounded-lg">
              <span className="text-cream-200 font-medium">{item.itemName}</span>
              <span className="font-mono font-bold text-gold-400">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        {actionButton}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
