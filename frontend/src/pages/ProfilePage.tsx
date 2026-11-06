import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Award, 
  ChefHat, 
  BarChart3, 
  ShieldCheck, 
  Calendar, 
  LogOut, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Save,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, logout, login, token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [outletName, setOutletName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.outletId) {
      api.get(`/outlets/${user.outletId}`)
        .then((res) => setOutletName(res.data.name))
        .catch(() => setOutletName('Hyderabad House - Kondapur'));
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.put('/auth/profile', { name, phone });
      setSuccessMsg('Profile updated successfully.');
      if (token && user) {
        login(token, { ...user, name, phone });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen py-20 text-center">
        <p className="text-sm text-charcoal-500">Please sign in to view your profile.</p>
        <Link to="/login" className="mt-3 inline-block font-bold text-maroon-900 underline">
          Go to Sign In
        </Link>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CENTRAL_ADMIN':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-red-600" /> Central Admin</span>;
      case 'OUTLET_MANAGER':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-purple-600" /> Outlet Manager</span>;
      case 'KITCHEN_STAFF':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><ChefHat className="w-4 h-4 text-amber-600" /> Kitchen Staff</span>;
      case 'CATERING_MANAGER':
        return <span className="px-3 py-1 bg-gold-100 text-gold-900 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gold-700" /> Catering Manager</span>;
      default:
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Award className="w-4 h-4 text-emerald-600" /> Royal Customer</span>;
    }
  };

  return (
    <div className="min-h-screen py-10 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 flex items-center justify-center text-gold-400 font-serif font-black text-2xl border border-gold-400/40 shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif font-bold text-2xl text-maroon-950">{user.name}</h1>
              {getRoleBadge(user.role)}
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-cream-100 hover:bg-cream-200 text-charcoal-700 hover:text-red-700 text-xs font-bold rounded-xl transition-colors border border-cream-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Role Details & Quick Links */}
        <div className="md:col-span-1 space-y-4">
          {/* Customer Specific Loyalty Card */}
          {user.role === 'CUSTOMER' && (
            <div className="bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-maroon-950 p-6 rounded-3xl text-white border border-gold-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400">Royal Loyalty</span>
                <Award className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <span className="text-3xl font-serif font-black text-white">{user.loyaltyPoints || 50}</span>
                <span className="text-xs text-cream-200 block">Available Points</span>
              </div>
              <p className="text-[11px] text-cream-300/80 leading-relaxed border-t border-cream-100/10 pt-3">
                1 point = ₹1 direct discount. Redeem during checkout on any royal biryani feast.
              </p>
              <Link
                to="/history"
                className="inline-flex items-center justify-center w-full py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold rounded-xl transition-colors"
              >
                View Order History
              </Link>
            </div>
          )}

          {/* Staff / Manager Assigned Outlet Card */}
          {(user.role === 'KITCHEN_STAFF' || user.role === 'OUTLET_MANAGER') && (
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-maroon-900 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-maroon-800" />
                <span>Assigned Outlet</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-maroon-950">{outletName || 'Kondapur Main Outlet'}</h3>
                <p className="text-xs text-charcoal-500 mt-0.5">Outlet ID: #{user.outletId || 1}</p>
              </div>

              {user.role === 'KITCHEN_STAFF' && (
                <Link
                  to="/kitchen"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-maroon-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Launch Tablet KDS</span>
                </Link>
              )}

              {user.role === 'OUTLET_MANAGER' && (
                <Link
                  to="/manager"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-maroon-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Open Manager Panel</span>
                </Link>
              )}
            </div>
          )}

          {/* Central Admin Shortcut Card */}
          {user.role === 'CENTRAL_ADMIN' && (
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-maroon-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Chain Operations</span>
              </div>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Full administrative access across all 17 Hyderabad House outlets, menu management, and real-time audit trails.
              </p>
              <Link
                to="/admin"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-maroon-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <span>Central Admin Suite</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Catering Manager Shortcut Card */}
          {user.role === 'CATERING_MANAGER' && (
            <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-maroon-900 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-gold-600" />
                <span>Bulk Feasts & Degs</span>
              </div>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Coordinate corporate catering, royal wedding orders, and deg preparations.
              </p>
              <Link
                to="/catering"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-maroon-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <span>Catering Desk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-md space-y-5 text-xs text-charcoal-800">
            <div>
              <h3 className="font-serif font-bold text-lg text-maroon-950">Profile Information</h3>
              <p className="text-xs text-charcoal-500">Update your account contact details used for deliveries and alerts</p>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-1 text-charcoal-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-charcoal-700">Email Address (Account Identifier)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-10 pr-4 py-2.5 bg-cream-100 text-charcoal-500 rounded-xl border border-cream-200 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-charcoal-400 mt-1 block">Email is permanently linked to your order records.</span>
              </div>

              <div>
                <label className="block font-bold mb-1 text-charcoal-700">Contact Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-cream-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-maroon-900 hover:bg-black text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
