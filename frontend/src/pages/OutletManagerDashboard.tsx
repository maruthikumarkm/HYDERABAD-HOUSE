import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  ShoppingBag, 
  CheckCircle, 
  Power, 
  Sliders, 
  Bell,
  RefreshCw,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Outlet, MenuItem, NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const OutletManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [outletId, setOutletId] = useState<number>(user?.outletId || 1);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [workloadLevel, setWorkloadLevel] = useState<string>('NORMAL');
  const [prepTimeOverride, setPrepTimeOverride] = useState<number>(25);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, itemsRes, alertsRes, outletsRes] = await Promise.all([
        api.get(`/outlet-manager/dashboard?outletId=${outletId}`),
        api.get(`/menu/outlet/${outletId}`),
        api.get(`/outlet-manager/alerts?outletId=${outletId}`),
        api.get('/outlets'),
      ]);

      setDashboardData(dashRes.data);
      setMenuItems(itemsRes.data);
      setAlerts(alertsRes.data);
      setOutlets(outletsRes.data);

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
