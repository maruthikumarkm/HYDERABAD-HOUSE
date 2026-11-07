import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Users, 
  AlertCircle,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { MenuItem, MenuCategory, Outlet } from '../types';
import wsService from '../services/websocket';
import api from '../services/api';

const COLORS = ['#800020', '#D4AF37', '#2563EB', '#10B981', '#8B5CF6', '#F59E0B'];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'MENU' | 'AUDIT'>('ANALYTICS');
  const [analytics, setAnalytics] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for Add/Edit Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: 1,
    basePrice: 240,
    isVeg: false,
    spiceLevel: 'MEDIUM',
    portionSize: 'Regular',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    allergenInfo: 'Contains Dairy',
    prepTimeMinutes: 20,
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, itemsRes, catRes, outletsRes, auditRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/menu/items'),
        api.get('/menu/categories'),
        api.get('/outlets'),
        api.get('/admin/audit-logs').catch(() => ({ data: [] })),
      ]);
      setAnalytics(analyticsRes.data);
      setMenuItems(itemsRes.data);
      setCategories(catRes.data);
      setOutlets(outletsRes.data);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to admin WebSocket updates
    const topic = '/topic/admin';
    wsService.subscribe(topic, () => {
      loadData();
    });

    // 8-second polling fallback
    const poll = setInterval(() => {
      loadData();
    }, 8000);

    return () => {
      wsService.unsubscribe(topic);
      clearInterval(poll);
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || 1,
      basePrice: 250,
      isVeg: false,
      spiceLevel: 'MEDIUM',
      portionSize: 'Regular',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
      allergenInfo: 'None',
      prepTimeMinutes: 20,
      description: '',
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      basePrice: item.basePrice,
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      portionSize: item.portionSize,
      imageUrl: item.imageUrl,
      allergenInfo: item.allergenInfo || 'None',
      prepTimeMinutes: item.prepTimeMinutes,
      description: item.description || '',
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/items/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/items', formData);
      }
      setIsItemModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save menu item', err);
    }
  };

  const handleToggleStatus = async (item: MenuItem) => {
    try {
      await api.patch(`/admin/items/${item.id}/status`, {
        isActive: !item.isActive,
      });
      loadData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  return (
    <div className="min-h-screen py-8 max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Admin Header */}
      <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-200">
            Central Headquarters
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-maroon-950 mt-1">
            Central Admin & Analytics
          </h1>
          <p className="text-xs text-charcoal-500">
            Manage menus across 17 outlets and review real-time direct sales performance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-cream-100 p-1 rounded-2xl border border-cream-200">
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ANALYTICS' ? 'bg-maroon-900 text-white shadow-xs' : 'text-charcoal-700 hover:text-maroon-900'
            }`}
          >
            Management Analytics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MENU')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MENU' ? 'bg-maroon-900 text-white shadow-xs' : 'text-charcoal-700 hover:text-maroon-900'
            }`}
          >
            Menu Catalog ({menuItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'AUDIT' ? 'bg-maroon-900 text-white shadow-xs' : 'text-charcoal-700 hover:text-maroon-900'
            }`}
          >
            Activity Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs">
              <span className="text-xs text-charcoal-500 font-semibold">Total Direct Sales</span>
              <div className="text-2xl font-black text-maroon-900 mt-1">₹{analytics.totalSales}</div>
              <span className="text-[10px] text-emerald-600 font-bold">100% Platform Direct</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs">
              <span className="text-xs text-charcoal-500 font-semibold">Total Orders</span>
              <div className="text-2xl font-black text-charcoal-900 mt-1">{analytics.totalOrders}</div>
              <span className="text-[10px] text-charcoal-400">All 17 Outlets</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs">
              <span className="text-xs text-charcoal-500 font-semibold">Avg Dum Time</span>
              <div className="text-2xl font-black text-gold-700 mt-1">{analytics.avgPrepTimeMinutes}m</div>
              <span className="text-[10px] text-charcoal-400">AI vs Actual avg</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs">
              <span className="text-xs text-charcoal-500 font-semibold">Repeat Customers</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{analytics.repeatCustomers}</div>
              <span className="text-[10px] text-blue-600 font-bold">Loyalty Retention</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs">
              <span className="text-xs text-charcoal-500 font-semibold">Cancelled Orders</span>
              <div className="text-2xl font-black text-charcoal-500 mt-1">{analytics.cancelledOrders}</div>
              <span className="text-[10px] text-emerald-600 font-bold">Low Churn</span>
            </div>
          </div>

          {/* Charts Row 1: Outlet Sales Bar Chart & Payment Breakdown Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sales by Outlet Bar Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-base text-maroon-950">Direct Sales by Outlet (₹)</h3>
                  <p className="text-xs text-charcoal-500">Live comparison across top performing kitchens</p>
                </div>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                {analytics.totalOrders > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.outletPerformance || []}>
                      <XAxis dataKey="outletName" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#800020" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-charcoal-400 text-xs space-y-1">
                    <p className="font-bold text-charcoal-600">Zero orders recorded across all 17 outlets</p>
                    <p className="text-[11px] text-charcoal-400">Live sales comparisons will populate automatically as orders occur</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Pie Chart */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif font-bold text-base text-maroon-950">Payment Breakdown</h3>
                <p className="text-xs text-charcoal-500">PhonePe UPI vs Pay at Counter</p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {analytics.paymentBreakdown && analytics.paymentBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.paymentBreakdown || []}
                        dataKey="count"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label
                      >
                        {(analytics.paymentBreakdown || []).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-charcoal-400 text-xs space-y-1">
                    <p className="font-bold text-charcoal-600">No payment transactions yet</p>
                    <p className="text-[11px] text-charcoal-400">UPI & counter payments will appear once orders are placed</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Popular Items Table */}
          <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-maroon-950">Best Selling Dishes & Volume</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-cream-100 text-charcoal-700 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3 rounded-l-xl">Dish Name</th>
                    <th className="p-3">Quantity Sold</th>
                    <th className="p-3 rounded-r-xl">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {analytics.popularItems && analytics.popularItems.length > 0 ? (
                    analytics.popularItems.map((dish: any, idx: number) => (
                      <tr key={idx} className="hover:bg-cream-50/50">
                        <td className="p-3 font-serif font-bold text-charcoal-900">{dish.name}</td>
                        <td className="p-3 font-semibold text-charcoal-700">{dish.quantitySold} units</td>
                        <td className="p-3 font-mono font-bold text-maroon-900">₹{dish.revenue}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-charcoal-400 font-medium">
                        No dish orders recorded yet. As customers order biryanis and kebabs, sales volumes will calculate live.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Menu Catalog Tab */}
      {activeTab === 'MENU' && (
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-cream-100 pb-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-maroon-950">Master Menu Catalog</h2>
              <p className="text-xs text-charcoal-500">Changes reflect instantly across customer website and all kitchens</p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="py-2.5 px-4 bg-maroon-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border border-cream-200 bg-cream-50/40 flex flex-col justify-between space-y-3">
                <div className="flex items-start space-x-3">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      <h4 className="font-serif font-bold text-xs text-charcoal-900 line-clamp-1">{item.name}</h4>
                    </div>
                    <span className="text-xs font-black text-maroon-900 mt-1 block">₹{item.basePrice}</span>
                    <span className="text-[10px] text-charcoal-500 font-medium">Prep: ~{item.prepTimeMinutes}m • {item.spiceLevel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-cream-200">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      item.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.isActive !== false ? 'Active' : 'Deactivated'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 bg-white hover:bg-cream-100 border border-cream-200 text-charcoal-700 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-cream-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-cream-100">
            <div>
              <h3 className="font-serif font-bold text-lg text-maroon-950">System Audit Trail</h3>
              <p className="text-xs text-charcoal-500">Immutable chronological log of platform orders, kitchen dispatches, and administrative changes</p>
            </div>
            <span className="text-xs font-bold text-gold-800 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
              {auditLogs.length} Events Logged
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-16 text-center text-charcoal-400 text-xs">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-800">
                <thead className="bg-cream-50 text-charcoal-600 font-bold uppercase tracking-wider text-[10px] border-b border-cream-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-cream-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-charcoal-500 whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' }) : '-'}
                      </td>
                      <td className="py-3 px-4 font-bold text-charcoal-900">{log.userName || 'System'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-cream-100 text-maroon-800">
                          {log.userRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-maroon-50 text-maroon-900 border border-maroon-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-charcoal-700">
                        {log.entityType} <span className="font-mono text-maroon-900">#{log.entityId}</span>
                      </td>
                      <td className="py-3 px-4 text-charcoal-600 max-w-xs truncate" title={log.details}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Item Modal (Create/Edit) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-cream-200 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-serif font-bold text-lg text-maroon-950">
              {editingItem ? 'Edit Menu Item' : 'Add New Royal Dish'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Base Price (₹ incl 5% GST)</label>
                  <input
                    type="number"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Classification</label>
                  <select
                    value={formData.isVeg ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.value === 'true' })}
                    className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                  >
                    <option value="false">Non-Veg</option>
                    <option value="true">Pure Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Spice Level</label>
                  <select
                    value={formData.spiceLevel}
                    onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
                    className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                  >
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="SPICY">Spicy</option>
                    <option value="EXTRA_SPICY">Extra Spicy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Dum Prep (mins)</label>
                  <input
                    type="number"
                    value={formData.prepTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Food Image URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-cream-50 rounded-xl border border-cream-200"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="py-2.5 px-4 bg-cream-200 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-maroon-900 text-white rounded-xl font-bold hover:bg-black"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
