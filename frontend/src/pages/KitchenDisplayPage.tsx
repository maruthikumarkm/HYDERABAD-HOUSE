import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  Bike, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  MapPin,
  Utensils
} from 'lucide-react';
import { Order, Outlet } from '../types';
import { useAuth } from '../context/AuthContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const KitchenDisplayPage: React.FC = () => {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number>(user?.outletId || 1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play audio chime when order arrives or changes
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported yet');
    }
  };

  // Fetch all outlets for switcher
  useEffect(() => {
    api.get('/outlets').then((res) => {
      setOutlets(res.data);
      if (user?.outletId) {
        setSelectedOutletId(user.outletId);
      }
    });
  }, [user]);

  // Load active orders for selected outlet
  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kitchen/orders?outletId=${selectedOutletId}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load kitchen orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Connect to WebSocket topic for this outlet's kitchen
    const topic = `/topic/kitchen/${selectedOutletId}`;
    wsService.subscribe(topic, (incomingOrder: any) => {
      console.log('[KDS WS] New or updated order received for kitchen:', incomingOrder);
      playAlertSound();
      loadOrders();
    });

    return () => {
      wsService.unsubscribe(topic);
    };
  }, [selectedOutletId]);

  // Status transition actions
  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.patch(`/kitchen/orders/${orderId}/status`, {
        status: nextStatus,
        notes: `Kitchen staff moved order to ${nextStatus}`,
      });
      loadOrders();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // 4 KDS Columns:
  // 1. NEW ORDERS (PLACED)
  // 2. PREPARING (CONFIRMED, PREPARING)
  // 3. READY (READY_FOR_PICKUP)
  // 4. HANDED OFF (RIDER_HANDOFF, COMPLETED)
  const newOrders = orders.filter((o) => o.status === 'PLACED');
  const preparingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const handedOffOrders = orders.filter((o) => o.status === 'RIDER_HANDOFF');

  const selectedOutletObj = outlets.find((o) => o.id === selectedOutletId);

  return (
    <div className="min-h-screen bg-charcoal-950 text-white p-4 sm:p-6 flex flex-col space-y-4">
      {/* KDS Header Bar - High Contrast Tablet Optimized */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-maroon-800 text-gold-400 rounded-xl border border-gold-500/30">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-black text-xl tracking-wider text-white">
                KITCHEN DISPLAY SYSTEM (KDS)
              </h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                LIVE STOMP WS
              </span>
            </div>
            <p className="text-xs text-cream-300">
              Active Outlet: <strong className="text-gold-400">{selectedOutletObj?.name || 'Kondapur Kitchen'}</strong>
            </p>
          </div>
        </div>

        {/* Outlet Switcher & Sound Toggle */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(Number(e.target.value))}
            className="bg-charcoal-800 text-cream-100 border border-charcoal-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-gold-500"
          >
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name.replace('Hyderabad House - ', '')} ({o.type === 'CLOUD_KITCHEN' ? 'Cloud' : 'Dine-in'})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled ? 'bg-gold-500 text-charcoal-950 border-gold-400' : 'bg-charcoal-800 text-charcoal-400 border-charcoal-700'
            }`}
            title={soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="p-2.5 bg-charcoal-800 hover:bg-charcoal-700 border border-charcoal-700 text-cream-200 rounded-xl"
            title="Refresh order list"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4 Tablet Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
        {/* Column 1: NEW ORDERS */}
        <div className="bg-charcoal-900/90 rounded-2xl border border-charcoal-800 p-3.5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="font-serif font-black text-sm tracking-wider uppercase text-amber-400">
                1. New Orders
              </h2>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              {newOrders.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
            {newOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                accent="border-amber-500/40 bg-charcoal-850"
                actionButton={
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(o.id, 'PREPARING')}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-xs uppercase rounded-xl tracking-wider shadow-md transition-all active:scale-95"
                  >
                    Accept & Start Dum
                  </button>
                }
              />
            ))}
            {newOrders.length === 0 && (
              <p className="text-center text-xs text-charcoal-600 py-12">No new incoming orders</p>
            )}
          </div>
        </div>

        {/* Column 2: PREPARING (Dum Cooking) */}
        <div className="bg-charcoal-900/90 rounded-2xl border border-charcoal-800 p-3.5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="font-serif font-black text-sm tracking-wider uppercase text-blue-400">
                2. Preparing (Dum)
              </h2>
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
            {preparingOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                accent="border-blue-500/40 bg-charcoal-850"
                actionButton={
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(o.id, 'READY_FOR_PICKUP')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-md transition-all active:scale-95"
                  >
                    Mark Ready to Pack
                  </button>
                }
              />
            ))}
            {preparingOrders.length === 0 && (
              <p className="text-center text-xs text-charcoal-600 py-12">Kitchen clear</p>
            )}
          </div>
        </div>

        {/* Column 3: READY */}
        <div className="bg-charcoal-900/90 rounded-2xl border border-charcoal-800 p-3.5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-serif font-black text-sm tracking-wider uppercase text-emerald-400">
                3. Ready for Counter
              </h2>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
            {readyOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                accent="border-emerald-500/50 bg-charcoal-850"
                actionButton={
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(o.id, o.orderType === 'DELIVERY' ? 'RIDER_HANDOFF' : 'COMPLETED')}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-charcoal-950 font-black text-xs uppercase rounded-xl tracking-wider shadow-md transition-all active:scale-95"
                  >
                    {o.orderType === 'DELIVERY' ? 'Handoff to Rider' : 'Complete Handover'}
                  </button>
                }
              />
            ))}
            {readyOrders.length === 0 && (
              <p className="text-center text-xs text-charcoal-600 py-12">No orders staged at counter</p>
            )}
          </div>
        </div>

        {/* Column 4: HANDED OFF / OUT FOR DELIVERY */}
        <div className="bg-charcoal-900/90 rounded-2xl border border-charcoal-800 p-3.5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <h2 className="font-serif font-black text-sm tracking-wider uppercase text-purple-400">
                4. On Road / Dispatched
              </h2>
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
              {handedOffOrders.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
            {handedOffOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                accent="border-purple-500/30 bg-charcoal-850"
                actionButton={
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(o.id, 'COMPLETED')}
                    className="w-full py-3 bg-charcoal-700 hover:bg-charcoal-600 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-all"
                  >
                    Confirm Delivery Done
                  </button>
                }
              />
            ))}
            {handedOffOrders.length === 0 && (
              <p className="text-center text-xs text-charcoal-600 py-12">No active deliveries on road</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Large Touch Order Card for Tablet KDS
interface OrderCardProps {
  order: Order;
  accent: string;
  actionButton: React.ReactNode;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, accent, actionButton }) => {
  // Elapsed time calculation
  const placedTime = new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Highlight Late orders in Red
  const isLate = order.isLate;

  return (
    <div className={`p-4 rounded-2xl border shadow-md flex flex-col justify-between space-y-3 transition-all ${accent} ${
      isLate ? 'border-red-500 ring-2 ring-red-500/40 bg-red-950/20' : ''
    }`}>
      <div>
        {/* Top Header: Order Number & Mode */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-base font-mono font-black tracking-wider text-gold-300">
              {order.orderNumber}
            </span>
            <div className="text-[11px] text-cream-400 flex items-center space-x-1 mt-0.5">
              <Clock className="w-3 h-3 text-gold-500" />
              <span>Placed: {placedTime}</span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
              order.orderType === 'DELIVERY' ? 'bg-blue-900/60 text-blue-200' : 'bg-emerald-900/60 text-emerald-200'
            }`}>
              {order.orderType}
            </span>
            {isLate && (
              <span className="block mt-1 text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded uppercase animate-bounce">
                OVERDUE
              </span>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="mt-2 text-xs text-cream-200 font-semibold border-b border-charcoal-800 pb-2">
          {order.customerName} ({order.customerPhone})
        </div>

        {/* Food Items & Quantities - Large Touch Readable Text */}
        <div className="mt-3 space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="bg-charcoal-900/80 p-2.5 rounded-xl border border-charcoal-800">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-white">
                  {item.itemName}
                </span>
                <span className="text-base font-mono font-black text-gold-400 px-2 py-0.5 bg-black/40 rounded-lg">
                  ×{item.quantity}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-cream-400 mt-1">
                <span>{item.portionSize}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{item.spiceLevel}</span>
              </div>
              {item.specialInstructions && (
                <p className="text-[11px] text-gold-300 italic mt-1 bg-black/30 p-1.5 rounded">
                  ⚠️ Note: {item.specialInstructions}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* General Special Instructions */}
        {order.specialInstructions && (
          <div className="mt-2 p-2 rounded-lg bg-maroon-950/60 border border-maroon-800/40 text-[11px] text-cream-200">
            <strong>Order Instructions:</strong> {order.specialInstructions}
          </div>
        )}
      </div>

      {/* Large Touch-friendly Action Button */}
      <div className="pt-2">
        {actionButton}
      </div>
    </div>
  );
};

export default KitchenDisplayPage;
