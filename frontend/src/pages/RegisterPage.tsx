import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Lock, Mail, User as UserIcon, Phone, ShieldCheck, ArrowRight, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // DPDP Act 2023 Marketing consent flags (Optional)
  const [emailPromotions, setEmailPromotions] = useState(false);
  const [smsPromotions, setSmsPromotions] = useState(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        emailPromotions,
        smsPromotions,
        whatsappUpdates,
      });

      const { token, id, role, loyaltyPoints } = res.data;
      login(token, { id, name, email, phone, role: 'CUSTOMER', loyaltyPoints: loyaltyPoints || 50 });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 flex items-center justify-center border border-gold-400 shadow-md">
              <Flame className="w-7 h-7 text-gold-400" />
            </div>
          </Link>
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-maroon-950">
            Create Customer Account
          </h2>
          <p className="text-xs text-charcoal-500">
            Direct orders • Zero platform markup • Free Royal Loyalty Program
          </p>
        </div>

        {/* Welcome Bonus Callout */}
        <div className="bg-gold-50 border border-gold-300 p-3.5 rounded-2xl flex items-center space-x-3 text-gold-950">
          <div className="p-2 bg-gold-500 text-charcoal-900 rounded-xl flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs">50 Welcome Points Free!</h4>
            <p className="text-[11px] text-gold-800">Sign up today and get ₹50 instant discount on your first royal biryani.</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-xl space-y-4 text-xs">
          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Phone Number (Hyderabad)</label>
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

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Create Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800"
              />
            </div>
          </div>

          {/* Section 13: DPDP Act 2023 Consent & Privacy Principles */}
          <div className="pt-2 border-t border-cream-100 space-y-2">
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-charcoal-500 leading-normal">
                <strong>DPDP Act 2023 Notice:</strong> Your personal data is encrypted and processed strictly for direct food order delivery. Marketing preferences are completely optional.
              </p>
            </div>

            <div className="bg-cream-50 p-2.5 rounded-xl border border-cream-200 space-y-1.5 text-[11px] text-charcoal-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  className="rounded border-cream-300 text-maroon-800 accent-maroon-800"
                />
                <span>WhatsApp Live Dum tracking notifications</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailPromotions}
                  onChange={(e) => setEmailPromotions(e.target.checked)}
                  className="rounded border-cream-300 text-maroon-800 accent-maroon-800"
                />
                <span>Occasional festival discounts & Nizam weekend deals</span>
              </label>
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
            className="w-full py-3.5 px-4 bg-maroon-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Register & Claim 50 Pts'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-xs text-charcoal-600">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-maroon-900 hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
