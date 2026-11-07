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
  UtensilsCrossed,
  Calendar,
  Sparkles,
  Users,
  Check
} from 'lucide-react';
import { Order, Outlet, PartyOrder } from '../types';
import { useAuth } from '../context/AuthContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const KitchenDisplayPage: React.FC = () => {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number>(user?.outletId || 1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partyOrders, setPartyOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<PartyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'KDS' | 'PARTY_FEASTS' | 'COMPLETED'>('KDS');

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

  // Load orders for selected outlet
  const loadOrders = async () => {
    setLoading(true);
    try {
      const [kdsRes, partyRes, inqRes] = await Promise.all([
        api.get(`/kitchen/orders?outletId=${selectedOutletId}`),
        api.get(`/kitchen/party-orders?outletId=${selectedOutletId}`),
        api.get('/party-orders').catch(() => ({ data: [] })),
      ]);
      setOrders(kdsRes.data);
      setPartyOrders(partyRes.data);
      setInquiries(inqRes.data || []);
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
      console.log('[KDS WS] Order update received for kitchen:', incomingOrder);
      playAlertSound();
      loadOrders();
    });

    // 5-second polling interval
    const poll = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => {
      wsService.unsubscribe(topic);
      clearInterval(poll);
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
  const newOrders = orders.filter((o) => o.status === 'PLACED');
  const preparingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'READY');
  const handedOffOrders = orders.filter((o) => 
    o.status === 'ASSIGNED' || o.status === 'ACCEPTED' || o.status === 'PICKED_UP' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'RIDER_HANDOFF'
  );

  const completedOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');

  const selectedOutletObj = outlets.find((o) => o.id === selectedOutletId);

  return (
    <div className="min-h-screen bg-charcoal-950 text-white p-4 sm:p-6 flex flex-col space-y-4">
      {/* KDS Header Bar */}
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

        {/* Outlet Switcher & Controls */}
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

      {/* 3 Tabs: Live KDS, Party & Bulk Feasts, Completed Orders */}
      <div className="flex space-x-2 border-b border-charcoal-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('KDS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'KDS'
              ? 'bg-gold-500 text-charcoal-950 shadow-md'
              : 'bg-charcoal-900 text-charcoal-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Live KDS Columns</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-gold-200">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PARTY_FEASTS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PARTY_FEASTS'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-charcoal-900 text-charcoal-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Party & Bulk Feasts</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-amber-200">
            {partyOrders.length + inquiries.length}
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
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed Log</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/40 text-cream-300">
            {completedOrders.length}
          </span>
        </button>
      </div>

      {/* TAB 1: 4 KDS Columns */}
      {activeTab === 'KDS' && (
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
                  3. Ready for Rider / Counter
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
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl text-center">
                      Staged for Rider Assignment
                    </div>
                  }
                />
              ))}
              {readyOrders.length === 0 && (
                <p className="text-center text-xs text-charcoal-600 py-12">No orders staged at counter</p>
              )}
            </div>
          </div>

          {/* Column 4: ASSIGNED / ON ROAD */}
          <div className="bg-charcoal-900/90 rounded-2xl border border-charcoal-800 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <h2 className="font-serif font-black text-sm tracking-wider uppercase text-purple-400">
                  4. Rider Assigned / Transit
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
                    <div className="p-2.5 bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl text-center">
                      {o.deliveryStaff ? `Assigned to ${o.deliveryStaff.name}` : `Status: ${o.status}`}
                    </div>
                  }
                />
              ))}
              {handedOffOrders.length === 0 && (
                <p className="text-center text-xs text-charcoal-600 py-12">No active deliveries on road</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTY & BULK FEASTS (Merged Catering View) */}
      {activeTab === 'PARTY_FEASTS' && (
        <div className="space-y-6">
          {/* Real Party Orders from DB */}
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-gold-400" />
                <h2 className="font-serif font-black text-lg text-white">
                  Real Database Party / Bulk Orders
                </h2>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-3 py-1 rounded-full">
                {partyOrders.length} Feasts
              </span>
            </div>

            {partyOrders.length === 0 ? (
              <p className="text-xs text-charcoal-400 text-center py-8">
                No party/bulk orders placed yet for this outlet. New orders placed from the Party Orders page will appear here.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {partyOrders.map((order) => (
                  <div key={order.id} className="bg-charcoal-850 border border-gold-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-mono font-black text-gold-300">{order.orderNumber}</span>
                        <div className="text-xs font-bold text-white mt-0.5">{order.customerName} ({order.customerPhone})</div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold uppercase">
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Guests</span>
                        <span className="font-bold text-white">{order.partyDetails?.guestCount || 25} Persons</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-400 uppercase font-bold block">Event Date</span>
                        <span className="font-bold text-white">{order.partyDetails?.eventDate || 'Confirmed Date'} at {order.partyDetails?.eventTime || '19:30'}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Dishes Desired:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-charcoal-800 text-cream-200 rounded-lg text-[11px] font-semibold border border-charcoal-700">
                            {item.itemName} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {order.specialInstructions && (
                      <p className="text-[11px] text-gold-300 italic bg-maroon-950/40 p-2 rounded-lg">
                        <strong>Note:</strong> {order.specialInstructions}
                      </p>
                    )}

                    {/* Status Button for Kitchen */}
                    {order.status === 'PLACED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs uppercase rounded-xl transition-all"
                      >
                        Accept & Start Dum Deg Preparation
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-all"
                      >
                        Mark Feast Ready for Delivery Handoff
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legacy Party Inquiries (Preserved) */}
          {inquiries.length > 0 && (
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gold-400" />
                  <h3 className="font-serif font-black text-base text-cream-200">
                    Catering Inquiries & Quotes
                  </h3>
                </div>
                <span className="text-xs text-charcoal-400">{inquiries.length} Requests</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="bg-charcoal-850 border border-charcoal-800 rounded-2xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{inq.customerName}</span>
                        <div className="text-charcoal-400 text-[11px]">{inq.phoneNumber} • {inq.email}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-charcoal-800 text-cream-300">
                        {inq.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-black/30 p-2.5 rounded-xl text-[11px]">
                      <div>
                        <span className="text-charcoal-400 block">Date</span>
                        <span className="font-bold text-white">{inq.eventDate} at {inq.eventTime}</span>
                      </div>
                      <div>
                        <span className="text-charcoal-400 block">Guests</span>
                        <span className="font-bold text-white">{inq.numberOfGuests} Persons</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Food Selections:</span>
                      <p className="text-cream-200 text-[11px] mt-0.5 bg-black/20 p-2 rounded-lg font-mono">
                        {inq.foodSelectionsJson}
                      </p>
                    </div>

                    {inq.specialInstructions && (
                      <p className="text-[11px] text-gold-300 italic">
                        <strong>Note:</strong> {inq.specialInstructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED LOG */}
      {activeTab === 'COMPLETED' && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="font-serif font-black text-lg text-white">
                Completed & Handed Over Orders
              </h2>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-mono font-bold">
              {completedOrders.length} Done
            </span>
          </div>

          {completedOrders.length === 0 ? (
            <p className="text-xs text-charcoal-400 text-center py-12">No orders marked completed today yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map((o) => (
                <div key={o.id} className="p-4 bg-charcoal-850 rounded-2xl border border-charcoal-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-gold-300">{o.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase">
                      {o.status}
                    </span>
                  </div>
                  <div className="font-bold text-white">{o.customerName}</div>
                  <div className="text-charcoal-400 text-[11px]">
                    {o.items?.map((it) => `${it.itemName} × ${it.quantity}`).join(', ')}
                  </div>
                  <div className="pt-2 border-t border-charcoal-800 flex justify-between text-cream-300 font-mono text-[11px]">
                    <span>Amount: ₹{o.totalAmount}</span>
                    <span>{new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Touch Order Card
interface OrderCardProps {
  order: Order;
  accent: string;
  actionButton: React.ReactNode;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, accent, actionButton }) => {
  const placedTime = new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isLate = order.isLate;
  const isParty = order.orderType === 'PARTY_BULK' || Boolean(order.partyDetails);

  return (
    <div className={`p-4 rounded-2xl border shadow-md flex flex-col justify-between space-y-3 transition-all ${accent} ${
      isLate ? 'border-red-500 ring-2 ring-red-500/40 bg-red-950/20' : ''
    }`}>
      <div>
        {/* Party Badge if bulk order */}
        {isParty && (
          <div className="bg-gradient-to-r from-amber-600 to-gold-600 text-charcoal-950 px-2.5 py-1 rounded-lg mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Royal Party Feast</span>
            </span>
            <span>{order.partyDetails?.guestCount || 25} Guests</span>
          </div>
        )}

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
              order.orderType === 'DELIVERY' || order.orderType === 'PARTY_BULK' 
                ? 'bg-blue-900/60 text-blue-200' 
                : 'bg-emerald-900/60 text-emerald-200'
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

        {/* Food Items & Quantities */}
        <div className="mt-3 space-y-2">
          {order.items?.map((item, idx) => (
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
