import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Flame, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound,
  CheckCircle2,
  X,
  Users,
  ChefHat,
  BarChart3,
  Bike
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type RoleType = 'CUSTOMER' | 'KITCHEN_STAFF' | 'OUTLET_MANAGER' | 'CENTRAL_ADMIN' | 'DELIVERY_STAFF';

const ROLES: { id: RoleType; label: string; icon: React.FC<any>; color: string; desc: string }[] = [
  { id: 'CUSTOMER', label: 'Customer', icon: Users, color: 'text-blue-600', desc: 'Order Biryani & Track' },
  { id: 'KITCHEN_STAFF', label: 'Kitchen Staff', icon: ChefHat, color: 'text-amber-600', desc: 'Kitchen Display & Feasts' },
  { id: 'OUTLET_MANAGER', label: 'Outlet Manager', icon: BarChart3, color: 'text-purple-600', desc: 'Outlet & Rider Dispatch' },
  { id: 'CENTRAL_ADMIN', label: 'Central Admin', icon: ShieldCheck, color: 'text-red-600', desc: 'HQ Analytics & Control' },
  { id: 'DELIVERY_STAFF', label: 'Delivery Staff', icon: Bike, color: 'text-emerald-600', desc: 'Active Orders & Dispatch' },
];

export const LoginPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getInitialRole = (): RoleType => {
    const roleParam = searchParams.get('role') || (location.state as any)?.role;
    if (roleParam && ROLES.some(r => r.id === roleParam.toUpperCase())) {
      return roleParam.toUpperCase() as RoleType;
    }
    return 'CUSTOMER';
  };

  const [selectedRole, setSelectedRole] = useState<RoleType>(getInitialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role if query parameter changes
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ROLES.some(r => r.id === roleParam.toUpperCase())) {
      setSelectedRole(roleParam.toUpperCase() as RoleType);
    }
  }, [searchParams]);

  // Forgot / Reset Password state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1); // 1 = enter email, 2 = enter token + new password
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const executeLogin = async (loginEmail: string, loginPass: string, roleToVerify: RoleType) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail.trim(),
        password: loginPass,
        selectedRole: roleToVerify,
      });

      const { token, id, name, role, outletId, loyaltyPoints } = res.data;
      login(token, { id, name, email: loginEmail.trim(), role, outletId, loyaltyPoints });

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
        case 'DELIVERY_STAFF':
          navigate('/delivery');
          break;
        case 'CATERING_MANAGER':
          navigate('/kitchen');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(email, password, selectedRole);
  };

  const handleRoleSelect = (roleId: RoleType) => {
    setSelectedRole(roleId);
    setError(null);
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    try {
      const res = await api.post('/auth/forgot-password', { email: resetEmail.trim() });
      if (res.data.token) {
        setResetToken(res.data.token);
      }
      setResetStep(2);
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'No registered account found with this email address.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please retype carefully.');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const res = await api.post('/auth/reset-password', {
        token: resetToken.trim(),
        newPassword,
      });
      setResetSuccess(res.data.message || 'Password successfully updated! You can now sign in.');
      setTimeout(() => {
        setIsResetModalOpen(false);
        setPassword(newPassword);
        setEmail(resetEmail);
        setResetStep(1);
        setResetSuccess(null);
      }, 1800);
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Failed to reset password. Please check your token.');
    } finally {
      setResetLoading(false);
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
            Direct Food Ordering Platform & Operational Suites
          </p>
        </div>

        {/* Role Selector (All 5 System Roles) */}
        <div className="bg-cream-100 p-4 rounded-3xl border border-cream-200 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700">
              Select Login Role
            </span>
            <span className="text-[10px] text-charcoal-500 font-medium">
              Click to select account type
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {ROLES.slice(0, 4).map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all ${
                    isSelected
                      ? 'bg-maroon-900 text-white shadow-md ring-2 ring-gold-400 border border-gold-400'
                      : 'bg-white hover:bg-cream-50 text-charcoal-800 border border-cream-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-gold-300' : role.color}`} />
                  <span className="truncate">{role.label}</span>
                </button>
              );
            })}

            {/* Delivery Staff spans 2 columns */}
            {(() => {
              const delivery = ROLES[4];
              const Icon = delivery.icon;
              const isSelected = selectedRole === delivery.id;
              return (
                <button
                  type="button"
                  onClick={() => handleRoleSelect(delivery.id)}
                  className={`col-span-2 p-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all ${
                    isSelected
                      ? 'bg-maroon-900 text-white shadow-md ring-2 ring-gold-400 border border-gold-400'
                      : 'bg-white hover:bg-cream-50 text-charcoal-800 border border-cream-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-gold-300' : delivery.color}`} />
                  <span>{delivery.label}</span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Regular Secure Login Form */}
        <form onSubmit={handleLoginSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-xl space-y-4">
          {/* Active Role Indicator */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-charcoal-500 font-medium">Signing in as:</span>
              <span className="text-xs font-bold text-maroon-950 bg-white px-2.5 py-0.5 rounded-lg border border-cream-200 shadow-2xs">
                {ROLES.find(r => r.id === selectedRole)?.label}
              </span>
            </div>
            <span className="text-[10px] text-charcoal-400 font-medium hidden sm:inline">Role verified by backend</span>
          </div>
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
                onClick={() => {
                  setResetEmail(email);
                  setIsResetModalOpen(true);
                  setResetStep(1);
                  setResetError(null);
                  setResetSuccess(null);
                }}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-maroon-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-xs text-charcoal-600">
            <span>Don't have an account? </span>
            <Link 
              to={`/register?role=${selectedRole}`}
              state={{ role: selectedRole }}
              className="font-bold text-maroon-900 hover:underline"
            >
              Create {ROLES.find(r => r.id === selectedRole)?.label} Account
            </Link>
          </div>
        </form>
      </div>

      {/* Forgot / Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-cream-200 space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-maroon-50 text-maroon-900 rounded-2xl border border-maroon-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-maroon-950">Password Recovery</h3>
                <p className="text-[11px] text-charcoal-500">
                  {resetStep === 1 ? 'Enter your registered email to receive a recovery token' : 'Enter recovery token & new password'}
                </p>
              </div>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetToken} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@hyderabadhouse.com"
                    className="w-full px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 px-4 bg-maroon-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Generating Token...' : 'Generate Recovery Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Recovery Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter 16-character token"
                    className="w-full px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200 font-mono tracking-wider focus:ring-2 focus:ring-maroon-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
                  />
                </div>
                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="py-2.5 px-4 bg-cream-100 hover:bg-cream-200 text-charcoal-800 font-bold rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 px-4 bg-maroon-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
