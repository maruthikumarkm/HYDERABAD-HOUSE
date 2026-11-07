import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Flame, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  Award,
  Users,
  ChefHat,
  BarChart3,
  Bike,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type RoleType = 'CUSTOMER' | 'KITCHEN_STAFF' | 'OUTLET_MANAGER' | 'CENTRAL_ADMIN' | 'DELIVERY_STAFF';

interface RoleConfig {
  id: RoleType;
  label: string;
  icon: React.FC<any>;
  color: string;
  title: string;
  subtitle: string;
  calloutTitle: string;
  calloutDesc: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'CUSTOMER',
    label: 'Customer',
    icon: Users,
    color: 'text-blue-600',
    title: 'Create Customer Account',
    subtitle: 'Direct food orders • Zero platform markup • Free Royal Loyalty Program',
    calloutTitle: '50 Welcome Points Free!',
    calloutDesc: 'Sign up today and get ₹50 instant discount on your first royal biryani.'
  },
  {
    id: 'KITCHEN_STAFF',
    label: 'Kitchen Staff',
    icon: ChefHat,
    color: 'text-amber-600',
    title: 'Create Kitchen Staff Account',
    subtitle: 'Kitchen Display System (KDS) • Station ticketing & live order preparation',
    calloutTitle: 'Kitchen Staff Station Access',
    calloutDesc: 'Direct integration with your outlet kitchen KDS display and order timers.'
  },
  {
    id: 'OUTLET_MANAGER',
    label: 'Outlet Manager',
    icon: BarChart3,
    color: 'text-purple-600',
    title: 'Create Outlet Manager Account',
    subtitle: 'Outlet Operations • Live orders, inventory, kitchen workload & alerts',
    calloutTitle: 'Branch Management Access',
    calloutDesc: 'Operational controls for assigned outlet inventory, menus, and cooking speeds.'
  },
  {
    id: 'CENTRAL_ADMIN',
    label: 'Central Admin',
    icon: ShieldCheck,
    color: 'text-red-600',
    title: 'Create Central Admin Account',
    subtitle: 'Central HQ • All 17 outlets, menu management, sales analytics & system control',
    calloutTitle: 'Central HQ Executive Access',
    calloutDesc: 'System-wide control across all 17 Hyderabad branches, revenue, and master menu.'
  },
  {
    id: 'DELIVERY_STAFF',
    label: 'Delivery Staff',
    icon: Bike,
    color: 'text-emerald-600',
    title: 'Create Delivery Staff Account',
    subtitle: 'Rider Console • Order pickups, live route dispatch & instant handoffs',
    calloutTitle: 'Rider Dispatch Access',
    calloutDesc: 'Assigned orders, pickup notifications from kitchen, and live delivery updates.'
  },
];

export const RegisterPage: React.FC = () => {
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number>(1);
  
  // DPDP Act 2023 Marketing consent flags (Optional)
  const [emailPromotions, setEmailPromotions] = useState(false);
  const [smsPromotions, setSmsPromotions] = useState(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Sync role if query parameter updates
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ROLES.some(r => r.id === roleParam.toUpperCase())) {
      setSelectedRole(roleParam.toUpperCase() as RoleType);
    }
  }, [searchParams]);

  // Fetch outlets for kitchen staff and manager assignment
  useEffect(() => {
    api.get('/outlets')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setOutlets(res.data);
          setSelectedOutletId(res.data[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load outlets list:', err);
      });
  }, []);

  const handleRoleSelect = (roleId: RoleType) => {
    setSelectedRole(roleId);
    setSearchParams({ role: roleId });
    setError(null);
  };

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
      const isStaffWithOutlet = selectedRole === 'KITCHEN_STAFF' || selectedRole === 'OUTLET_MANAGER' || selectedRole === 'DELIVERY_STAFF';
      const res = await api.post('/auth/register', {
        name,
        email: email.trim(),
        phone,
        password,
        role: selectedRole,
        outletId: isStaffWithOutlet ? selectedOutletId : null,
        emailPromotions: selectedRole === 'CUSTOMER' ? emailPromotions : false,
        smsPromotions: selectedRole === 'CUSTOMER' ? smsPromotions : false,
        whatsappUpdates: selectedRole === 'CUSTOMER' ? whatsappUpdates : false,
      });

      const { token, id, role, outletId, loyaltyPoints } = res.data;
      login(token, { 
        id, 
        name, 
        email: email.trim(), 
        phone, 
        role, 
        outletId, 
        loyaltyPoints: loyaltyPoints || 0 
      });

      // Role-based redirection to the appropriate portal
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
      setError(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[0];

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
            {currentRoleConfig.title}
          </h2>
          <p className="text-xs text-charcoal-500">
            {currentRoleConfig.subtitle}
          </p>
        </div>

        {/* Role Selector Tabs (Role-Aware Registration) */}
        <div className="bg-cream-100 p-4 rounded-3xl border border-cream-200 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700">
              Registering Account Type
            </span>
            <span className="text-[10px] text-charcoal-500 font-medium">
              Selected: <strong className="text-maroon-900">{currentRoleConfig.label}</strong>
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

            {/* Delivery Staff full width button */}
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

        {/* Role-Specific Information Banner */}
        <div className={`p-3.5 rounded-2xl flex items-center space-x-3 border ${
          selectedRole === 'CUSTOMER'
            ? 'bg-gold-50 border-gold-300 text-gold-950'
            : 'bg-cream-50 border-cream-300 text-charcoal-900'
        }`}>
          <div className={`p-2 rounded-xl flex-shrink-0 ${
            selectedRole === 'CUSTOMER' ? 'bg-gold-500 text-charcoal-900' : 'bg-maroon-900 text-gold-400'
          }`}>
            {selectedRole === 'CUSTOMER' ? <Award className="w-5 h-5" /> : <currentRoleConfig.icon className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs">{currentRoleConfig.calloutTitle}</h4>
            <p className="text-[11px] opacity-90">{currentRoleConfig.calloutDesc}</p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-200 shadow-xl space-y-4 text-xs">
          {/* Active Role Indicator */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-cream-50 rounded-xl border border-cream-200">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-charcoal-500 font-medium">Account Role:</span>
              <span className="text-xs font-bold text-maroon-950 bg-white px-2.5 py-0.5 rounded-lg border border-cream-200 shadow-2xs">
                {currentRoleConfig.label}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Database Role: {selectedRole}
            </span>
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selectedRole === 'CUSTOMER' ? 'Rahul Sharma' : 'Staff Member Name'}
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
                placeholder={
                  selectedRole === 'CUSTOMER' 
                    ? 'rahul@example.com' 
                    : `${selectedRole.toLowerCase().replace('_', '.')}@hyderabadhouse.com`
                }
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

          {/* Assigned Outlet Selection for Staff */}
          {(selectedRole === 'KITCHEN_STAFF' || selectedRole === 'OUTLET_MANAGER' || selectedRole === 'DELIVERY_STAFF') && (
            <div>
              <label className="block font-bold text-charcoal-700 mb-1">
                Assigned Outlet ({selectedRole === 'OUTLET_MANAGER' ? 'Manager Branch' : selectedRole === 'DELIVERY_STAFF' ? 'Delivery Base Hub' : 'Kitchen Station'})
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-50 rounded-xl border border-cream-200 focus:ring-2 focus:ring-maroon-800 text-xs font-semibold text-charcoal-800"
                >
                  {outlets.length > 0 ? (
                    outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </option>
                    ))
                  ) : (
                    <option value={1}>Hyderabad House - Kondapur</option>
                  )}
                </select>
              </div>
            </div>
          )}

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

          {/* Customer-specific Marketing / DPDP Act Preferences */}
          {selectedRole === 'CUSTOMER' && (
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
          )}

          {/* Staff-specific Policy Notice */}
          {selectedRole !== 'CUSTOMER' && (
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200 flex items-start space-x-2 text-[11px] text-charcoal-600">
              <ShieldCheck className="w-4 h-4 text-maroon-800 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Operational Security:</strong> Account credentials provide access to Hyderabad House internal suites. Actions are logged in the central audit ledger.
              </span>
            </div>
          )}

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
            <span>
              {loading 
                ? 'Creating Account...' 
                : selectedRole === 'CUSTOMER' 
                  ? 'Register & Claim 50 Pts' 
                  : `Create ${currentRoleConfig.label} Account`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-xs text-charcoal-600">
            <span>Already have an account? </span>
            <Link 
              to={`/login?role=${selectedRole}`} 
              state={{ role: selectedRole }}
              className="font-bold text-maroon-900 hover:underline"
            >
              Sign In as {currentRoleConfig.label}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

