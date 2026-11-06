import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { token, id, name, role, outletId, loyaltyPoints } = res.data;
      login(token, { id, name, email: email.trim(), role, outletId, loyaltyPoints });

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
      setError(err.response?.data?.error || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
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

        {/* Regular Secure Login Form */}
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
            <span>Don't have a customer account? </span>
            <Link to="/register" className="font-bold text-maroon-900 hover:underline">
              Create an account
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
