import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Flame, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  ChefHat, 
  BarChart3, 
  Users, 
  Calendar 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotMsg(null);

    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      const { token, id, name, role, outletId, loyaltyPoints } = res.data;
      login(token, { id, name, email: loginEmail, role, outletId, loyaltyPoints });

      // Role-based redirection
      switch (role) {
        case 'KITCHEN_STAFF':
          navigate('/kitchen');
          break;
        case 'OUTLET_MANAGER':
          navigate('/manager');
          break;
        case 'CENTRAL_ADMIN':
          navigate('/admin');
          break;
        case 'CATERING_MANAGER':
          navigate('/catering');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    handleLoginSubmit(undefined, demoEmail, 'password123');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to recover your password.');
      return;
    }
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setForgotMsg(res.data.message);
    } catch (err: any) {
      setError('Error processing password reset request.');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 flex items-center justify-center border border-gold-400 shadow-md">
              <Flame className="w-7 h-7 text-gold-400" />
            </div>
          </Link>
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-maroon-950">
            Sign In to Hyderabad House
          </h2>
          <p className="text-xs text-charcoal-500">
            Direct Food Ordering Platform & Operations Suite
          </p>
        </div>

        {/* 1-Click Demo Logins for All 5 Roles */}
        <div className="bg-cream-100 p-4 rounded-3xl border border-cream-200 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-600 block text-center">
            ⚡ 1-Click Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer@hyderabadhouse.com')}
              className="p-2 bg-white hover:bg-cream-50 border border-cream-300 rounded-xl font-semibold text-charcoal-800 flex items-center space-x-1.5 shadow-2xs hover:border-maroon-800 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="truncate">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('kitchen.kondapur@hyderabadhouse.com')}
              className="p-2 bg-white hover:bg-cream-50 border border-cream-300 rounded-xl font-semibold text-charcoal-800 flex items-center space-x-1.5 shadow-2xs hover:border-maroon-800 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">Kitchen Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('manager.kondapur@hyderabadhouse.com')}
              className="p-2 bg-white hover:bg-cream-50 border border-cream-300 rounded-xl font-semibold text-charcoal-800 flex items-center space-x-1.5 shadow-2xs hover:border-maroon-800 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
              <span className="truncate">Outlet Manager</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('admin@hyderabadhouse.com')}
              className="p-2 bg-white hover:bg-cream-50 border border-cream-300 rounded-xl font-semibold text-charcoal-800 flex items-center space-x-1.5 shadow-2xs hover:border-maroon-800 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <span className="truncate">Central Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('catering@hyderabadhouse.com')}
              className="col-span-2 p-2 bg-white hover:bg-cream-50 border border-cream-300 rounded-xl font-semibold text-charcoal-800 flex items-center justify-center space-x-1.5 shadow-2xs hover:border-maroon-800 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
              <span>Catering Manager</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleLoginSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hyderabadhouse.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 text-xs focus:ring-2 focus:ring-maroon-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-charcoal-700">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] font-semibold text-maroon-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-cream-50 rounded-xl border border-cream-200 text-xs focus:ring-2 focus:ring-maroon-800 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-charcoal-400 hover:text-charcoal-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {forgotMsg && (
            <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium">
              {forgotMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-maroon-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-xs text-charcoal-600">
            <span>Don't have a customer account? </span>
            <Link to="/register" className="font-bold text-maroon-900 hover:underline">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
