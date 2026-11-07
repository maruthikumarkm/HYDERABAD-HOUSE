import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  ShoppingBag, 
  CheckCircle, 
  CheckCircle2,
  Power, 
  Sliders, 
  Bell,
  RefreshCw,
  TrendingUp,
  MapPin,
  Bike,
  Sparkles,
  Navigation,
  User as UserIcon
} from 'lucide-react';
import { Outlet, MenuItem, NotificationItem, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import wsService from '../services/websocket';
import api from '../services/api';

export const OutletManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [outletId, setOutletId] = useState<number>(user?.outletId || 1);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<any[]>([]);
  const [workloadLevel, setWorkloadLevel] = useState<string>('NORMAL');
  const [prepTimeOverride, setPrepTimeOverride] = useState<number>(25);
  const [loading, setLoading] = useState(true);
  const [assigningOrder, setAssigningOrder] = useState<number | null>(null);
  const [selectedStaffMap, setSelectedStaffMap] = useState<Record<number, number>>({});
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'READY' | 'ASSIGNED' | 'PREPARING'>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, itemsRes, alertsRes, outletsRes, staffRes] = await Promise.all([
        api.get(`/outlet-manager/dashboard?outletId=${outletId}`),
        api.get(`/menu/outlet/${outletId}`),
        api.get(`/outlet-manager/alerts?outletId=${outletId}`),
        api.get('/outlets'),
        api.get(`/outlet-manager/delivery-staff?outletId=${outletId}`).catch(() => ({ data: { available: [], all: [] } })),
      ]);

      setDashboardData(dashRes.data);
      setMenuItems(itemsRes.data);
      setAlerts(alertsRes.data);
      setOutlets(outletsRes.data);
      
      const avail = staffRes.data?.available || [];
      const all = staffRes.data?.all || [];
      setDeliveryStaff(avail.length > 0 ? avail : all);

      if (dashRes.data?.outlet) {
        setWorkloadLevel(dashRes.data.outlet.currentWorkloadLevel || 'NORMAL');
        setPrepTimeOverride(dashRes.data.outlet.minPrepTimeMinutes || 25);
      }
    } catch (err) {
      console.error('Failed to load manager dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Live WebSocket subscription to manager updates
    const topic = `/topic/manager/${outletId}`;
    wsService.subscribe(topic, () => {
      loadData();
    });

    // 5-second polling fallback
    const poll = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      wsService.unsubscribe(topic);
      clearInterval(poll);
    };
  }, [outletId]);

  const handleUpdateWorkload = async () => {
    try {
      await api.patch(`/outlet-manager/workload?outletId=${outletId}`, {
        workloadLevel,
        prepTimeMinutes: prepTimeOverride,
      });
      loadData();
    } catch (err) {
      console.error('Failed to update workload', err);
    }
  };

  const handleToggleItemStock = async (menuItemId: number, currentAvailability: boolean) => {
    try {
      await api.patch(`/outlet-manager/inventory/${menuItemId}?outletId=${outletId}`, {
        isAvailable: !currentAvailability,
      });
      loadData();
    } catch (err) {
      console.error('Failed to toggle item availability', err);
    }
  };

  const handleAssignDelivery = async (orderId: number) => {
    const staffId = selectedStaffMap[orderId] || (deliveryStaff.length > 0 ? deliveryStaff[0].id : null);
    if (!staffId) {
      alert('Please select an available delivery partner');
      return;
    }

    setAssigningOrder(orderId);
    try {
      await api.post(`/outlet-manager/orders/${orderId}/assign-delivery`, {
        deliveryStaffId: staffId,
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign delivery staff');
    } finally {
      setAssigningOrder(null);
    }
  };

  return (
    <div className="min-h-screen py-8 max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Top Bar with Outlet Switcher */}
      <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
            Outlet Command Center
          </span>
          <h1 className="font-serif font-black text-2xl text-maroon-950 mt-1">
            Outlet Manager Operations
          </h1>
          <p className="text-xs text-charcoal-500">Live workload management, out-of-stock toggles, and kitchen alerts</p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={outletId}
            onChange={(e) => setOutletId(Number(e.target.value))}
            className="px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-xs font-bold text-charcoal-800 focus:ring-2 focus:ring-maroon-800"
          >
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name.replace('Hyderabad House - ', '')}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 bg-maroon-900 text-white rounded-xl shadow-xs hover:bg-black transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-semibold">
            <span>Active Orders</span>
            <ShoppingBag className="w-4 h-4 text-maroon-800" />
          </div>
          <div className="text-2xl font-black text-maroon-950 mt-2">
            {dashboardData?.activeOrders || 0}
          </div>
          <span className="text-[10px] text-charcoal-400">In preparation or staging</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-semibold">
            <span>Late Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            {dashboardData?.lateOrders || 0}
          </div>
          <span className="text-[10px] text-red-500 font-bold">&gt;10 mins past promised</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-semibold">
            <span>Avg Dum Time</span>
            <Clock className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-2xl font-black text-charcoal-900 mt-2">
            {dashboardData?.avgPrepTimeMinutes || 25}m
          </div>
          <span className="text-[10px] text-charcoal-400">Based on active orders</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-cream-200 shadow-xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-semibold">
            <span>Direct Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{dashboardData?.totalSales || 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Today's direct volume</span>
        </div>
      </div>

      {/* Live Outlet Orders & Rider Dispatch Console */}
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-maroon-100 text-maroon-800 rounded-2xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg text-maroon-950">
                Live Outlet Orders & Delivery Dispatch
              </h2>
              <p className="text-xs text-charcoal-500">
                Assign delivery riders to prepared orders and monitor status transitions in real time.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-cream-100 p-1 rounded-2xl">
            {(['ALL', 'READY', 'ASSIGNED', 'PREPARING'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setOrderFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderFilter === f
                    ? 'bg-maroon-900 text-white shadow-xs'
                    : 'text-charcoal-600 hover:text-maroon-900'
                }`}
              >
                {f === 'READY' ? 'Ready for Pickup' : f === 'ASSIGNED' ? 'In-Transit' : f === 'PREPARING' ? 'Cooking' : 'All Orders'}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const allOrders: Order[] = dashboardData?.orders || [];
          const filteredOrders = allOrders.filter(o => {
            if (orderFilter === 'READY') return o.status === 'READY_FOR_PICKUP' || o.status === 'READY';
            if (orderFilter === 'ASSIGNED') return o.status === 'ASSIGNED' || o.status === 'ACCEPTED' || o.status === 'PICKED_UP' || o.status === 'OUT_FOR_DELIVERY';
            if (orderFilter === 'PREPARING') return o.status === 'PLACED' || o.status === 'CONFIRMED' || o.status === 'PREPARING';
            return true;
          });

          if (filteredOrders.length === 0) {
            return (
              <div className="text-center py-12 text-charcoal-400 text-xs">
                No orders matching the selected filter ({orderFilter}).
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map(order => {
                const isParty = order.orderType === 'PARTY_BULK' || Boolean(order.partyDetails);
                const isReady = order.status === 'READY_FOR_PICKUP' || order.status === 'READY';

                return (
                  <div 
                    key={order.id} 
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isReady ? 'border-amber-400 bg-amber-50/30' : 'border-cream-200 bg-cream-50/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-sm text-maroon-950">{order.orderNumber}</span>
                          {isParty && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-gold-500 text-charcoal-950 shadow-2xs">
                              👑 Royal Banquet ({order.partyDetails?.guestCount || 25} Guests)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-charcoal-500 mt-0.5">
                          {order.customerName} • {order.customerPhone}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          isReady 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : order.status === 'ASSIGNED' || order.status === 'ACCEPTED' || order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : order.status === 'DELIVERED' || order.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-cream-200 text-charcoal-700'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className="block mt-1 font-mono font-bold text-xs text-maroon-900">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Address & Instructions */}
                    <div className="text-xs text-charcoal-600 bg-white p-2.5 rounded-xl border border-cream-200 space-y-1">
                      <div className="flex items-start space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-maroon-800 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed truncate">
                          {order.deliveryAddress || 'Kondapur, Hyderabad'}
                        </span>
                      </div>
                      {order.specialInstructions && (
                        <p className="text-[10px] text-gold-900 italic pt-0.5">
                          Note: {order.specialInstructions}
                        </p>
                      )}
                    </div>

                    {/* Items Summary */}
                    <div className="text-[11px] text-charcoal-700 flex flex-wrap gap-1.5">
                      {order.items?.map((it, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white rounded-md border border-cream-200 font-medium">
                          {it.itemName} × {it.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Rider Assignment Action */}
                    {isReady ? (
                      <div className="pt-2 border-t border-cream-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-charcoal-500 mb-1">
                            Assign Delivery Staff:
                          </label>
                          <select
                            value={selectedStaffMap[order.id] || (deliveryStaff[0]?.id || '')}
                            onChange={(e) => setSelectedStaffMap(prev => ({ ...prev, [order.id]: Number(e.target.value) }))}
                            className="w-full py-1.5 px-2.5 text-xs bg-white border border-cream-300 rounded-xl font-bold text-charcoal-800"
                          >
                            {deliveryStaff.map(st => (
                              <option key={st.id} value={st.id}>
                                {st.name} ({st.phone}) • {st.availabilityStatus || 'AVAILABLE'}
                              </option>
                            ))}
                            {deliveryStaff.length === 0 && (
                              <option value="">No delivery staff registered</option>
                            )}
                          </select>
                        </div>
                        <div className="sm:self-end">
                          <button
                            type="button"
                            disabled={assigningOrder === order.id || deliveryStaff.length === 0}
                            onClick={() => handleAssignDelivery(order.id)}
                            className="w-full sm:w-auto py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>{assigningOrder === order.id ? 'Assigning...' : 'Dispatch Rider'}</span>
                          </button>
                        </div>
                      </div>
                    ) : order.deliveryStaff ? (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Bike className="w-4 h-4 text-emerald-700" />
                          <span className="font-bold text-emerald-950">
                            Rider: {order.deliveryStaff.name} ({order.deliveryStaff.phone})
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Workload Control & Prep Time Override Box */}
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-cream-100 pb-3">
          <Sliders className="w-5 h-5 text-maroon-800" />
          <h2 className="font-serif font-bold text-base text-maroon-950">
            Kitchen Workload & Prep Time Override
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
              Current Kitchen Workload Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'LOW', label: 'Low', color: 'bg-emerald-600' },
                { id: 'NORMAL', label: 'Normal', color: 'bg-blue-600' },
                { id: 'HIGH', label: 'Rush Hour', color: 'bg-amber-600' },
                { id: 'CRITICAL', label: 'Critical', color: 'bg-red-600' },
              ].map((w) => (
                <button
                  type="button"
                  key={w.id}
                  onClick={() => setWorkloadLevel(w.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    workloadLevel === w.id
                      ? `${w.color} text-white shadow-md border-transparent`
                      : 'bg-cream-50 text-charcoal-700 border-cream-200 hover:border-gold-400'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-charcoal-700 uppercase tracking-wider">Promised Prep Time Override</span>
              <span className="font-mono font-black text-maroon-900 text-sm">{prepTimeOverride} mins</span>
            </div>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={prepTimeOverride}
              onChange={(e) => setPrepTimeOverride(Number(e.target.value))}
              className="w-full accent-maroon-800"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleUpdateWorkload}
            className="py-2.5 px-6 bg-maroon-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Apply Kitchen Overrides
          </button>
        </div>
      </div>

      {/* Out-of-Stock Item Controls */}
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-cream-100 pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-maroon-950">
              Outlet Stock & Inventory Controls
            </h2>
            <p className="text-xs text-charcoal-500">
              Toggle availability for this outlet immediately. Disabled dishes are hidden and prevented from checkout.
            </p>
          </div>
          <span className="text-xs font-bold text-charcoal-700">{menuItems.length} Dishes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
          {menuItems.map((item) => {
            const isAvail = item.isAvailable !== false;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isAvail ? 'bg-cream-50/50 border-cream-200' : 'bg-red-50/70 border-red-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                  <div className="truncate">
                    <h5 className="font-serif font-bold text-xs text-charcoal-900 truncate">{item.name}</h5>
                    <span className="text-[11px] font-semibold text-charcoal-500">₹{item.price || item.basePrice}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleItemStock(item.id, isAvail)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-xs ${
                    isAvail
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isAvail ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Late Alerts and Incident Notifications Log */}
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-cream-100 pb-3">
          <Bell className="w-5 h-5 text-maroon-800" />
          <h2 className="font-serif font-bold text-base text-maroon-950">
            Outlet Alerts & Late Dispatch Notifications
          </h2>
        </div>

        <div className="divide-y divide-cream-100 space-y-2 max-h-60 overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className="pt-2 flex items-start space-x-3">
              <div className={`p-1.5 rounded-lg mt-0.5 ${
                alert.type === 'LATE_ALERT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-serif font-bold text-xs text-charcoal-900">{alert.title}</h5>
                <p className="text-xs text-charcoal-600 mt-0.5">{alert.message}</p>
                <span className="text-[10px] text-charcoal-400 font-mono">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="text-xs text-charcoal-400 text-center py-6">No active incidents or alerts</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutletManagerDashboard;
