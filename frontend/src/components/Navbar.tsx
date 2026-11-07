import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  MapPin, 
  User as UserIcon, 
  LogOut, 
  ChefHat, 
  BarChart3, 
  Sparkles, 
  Calendar, 
  Menu as MenuIcon, 
  X, 
  Flame,
  Award,
  Bike
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import OutletSelectorModal from './OutletSelectorModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { items, selectedOutlet, orderType, setOrderType, setIsCartOpen } = useCart();
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getDashboardLink = () => {
    if (!user) return null;
    switch (user.role) {
      case 'KITCHEN_STAFF':
        return { label: 'Kitchen KDS', path: '/kitchen', icon: ChefHat };
      case 'OUTLET_MANAGER':
        return { label: 'Manager Panel', path: '/manager', icon: BarChart3 };
      case 'CENTRAL_ADMIN':
        return { label: 'Admin HQ', path: '/admin', icon: BarChart3 };
      case 'DELIVERY_STAFF':
        return { label: 'Delivery Staff', path: '/delivery', icon: Bike };
      case 'CATERING_MANAGER':
        return { label: 'Kitchen KDS', path: '/kitchen', icon: ChefHat };
      default:
        return null;
    }
  };

  const dashboard = getDashboardLink();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-200 shadow-sm transition-all">
        {/* Top Announcement Bar */}
        <div className="bg-maroon-900 text-gold-200 text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
          <span>FLAT ₹100 OFF on orders above ₹499 | Use Code: <span className="font-bold text-white tracking-wider underline">HYD100</span></span>
          <span className="hidden sm:inline">| Guaranteed Dum-cooked in Desi Ghee</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 flex items-center justify-center shadow-md border border-gold-500/40 group-hover:scale-105 transition-transform">
                <Flame className="w-7 h-7 text-gold-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-extrabold text-xl sm:text-2xl tracking-wider text-maroon-900 group-hover:text-maroon-700 transition-colors">
                  HYDERABAD HOUSE
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase text-gold-700 font-semibold">
                  Royal Nizami Cuisine
                </span>
              </div>
            </Link>

            {/* Outlet Selector & Order Mode Toggle (Only for Customers / Unauthenticated) */}
            {(!user || user.role === 'CUSTOMER') && (
              <div className="hidden lg:flex items-center space-x-4 bg-cream-100 p-1.5 rounded-2xl border border-cream-200">
                <div className="flex bg-white rounded-xl shadow-xs p-0.5 border border-cream-200">
                  <button
                    type="button"
                    onClick={() => setOrderType('DELIVERY')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      orderType === 'DELIVERY'
                        ? 'bg-maroon-800 text-white shadow-xs'
                        : 'text-charcoal-700 hover:text-maroon-800'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('PICKUP')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      orderType === 'PICKUP'
                        ? 'bg-maroon-800 text-white shadow-xs'
                        : 'text-charcoal-700 hover:text-maroon-800'
                    }`}
                  >
                    Takeaway
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOutletModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-white hover:bg-cream-50 rounded-xl text-xs font-medium text-charcoal-800 border border-cream-200 shadow-xs hover:border-gold-500 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-maroon-800 flex-shrink-0" />
                  <span className="truncate max-w-[170px] text-left">
                    {selectedOutlet ? selectedOutlet.name.replace('Hyderabad House - ', '') : 'Select Outlet'}
                  </span>
                  <span className="text-[10px] bg-gold-100 text-gold-800 px-1.5 py-0.5 rounded font-bold">
                    {selectedOutlet?.minPrepTimeMinutes || 25}m
                  </span>
                </button>
              </div>
            )}

            {/* Role Header Badge for Staff */}
            {user && user.role !== 'CUSTOMER' && (
              <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 bg-maroon-900 text-gold-300 rounded-xl border border-gold-400/40 shadow-xs">
                {user.role === 'KITCHEN_STAFF' && <ChefHat className="w-4 h-4 text-gold-400" />}
                {user.role === 'OUTLET_MANAGER' && <BarChart3 className="w-4 h-4 text-gold-400" />}
                {user.role === 'CENTRAL_ADMIN' && <Sparkles className="w-4 h-4 text-gold-400" />}
                {user.role === 'DELIVERY_STAFF' && <Bike className="w-4 h-4 text-gold-400" />}
                <span className="text-xs font-bold tracking-wider">
                  {user.role === 'KITCHEN_STAFF' && 'KITCHEN KDS STATION'}
                  {user.role === 'OUTLET_MANAGER' && 'OUTLET MANAGER PANEL'}
                  {user.role === 'CENTRAL_ADMIN' && 'CENTRAL HEADQUARTERS'}
                  {user.role === 'DELIVERY_STAFF' && 'DELIVERY DISPATCH CONSOLE'}
                </span>
              </div>
            )}

            {/* Navigation Links — Strictly Role-Based */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-charcoal-800">
              {(!user || user.role === 'CUSTOMER') && (
                <>
                  <Link to="/#menu" className="hover:text-maroon-800 transition-colors font-semibold">
                    Menu
                  </Link>
                  <Link to="/outlets" className="hover:text-maroon-800 transition-colors font-semibold">
                    Outlets (17)
                  </Link>
                  <Link to="/party-orders" className="hover:text-maroon-800 transition-colors flex items-center space-x-1 font-semibold">
                    <Calendar className="w-4 h-4 text-gold-600" />
                    <span>Party Orders</span>
                  </Link>
                  <Link to="/orders" className="hover:text-maroon-800 transition-colors flex items-center space-x-1 font-semibold">
                    <ShoppingBag className="w-4 h-4 text-maroon-800" />
                    <span>My Orders</span>
                  </Link>
                  <Link to="/track" className="hover:text-maroon-800 transition-colors font-semibold">
                    Live Track
                  </Link>
                </>
              )}

              {user?.role === 'KITCHEN_STAFF' && (
                <Link to="/kitchen" className="px-3 py-1.5 bg-maroon-800 text-gold-300 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs">
                  <ChefHat className="w-4 h-4 text-gold-400" />
                  <span>Kitchen KDS Screen</span>
                </Link>
              )}

              {user?.role === 'OUTLET_MANAGER' && (
                <>
                  <Link to="/manager" className="px-3 py-1.5 bg-maroon-800 text-gold-300 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs">
                    <BarChart3 className="w-4 h-4 text-gold-400" />
                    <span>Outlet Manager Panel</span>
                  </Link>
                  <Link to="/kitchen" className="hover:text-maroon-800 text-xs font-bold transition-colors">
                    Kitchen KDS
                  </Link>
                </>
              )}

              {user?.role === 'CENTRAL_ADMIN' && (
                <>
                  <Link to="/admin" className="px-3 py-1.5 bg-maroon-800 text-gold-300 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs">
                    <BarChart3 className="w-4 h-4 text-gold-400" />
                    <span>Admin HQ Analytics</span>
                  </Link>
                  <Link to="/outlets" className="hover:text-maroon-800 text-xs font-bold transition-colors">
                    All 17 Outlets
                  </Link>
                </>
              )}

              {user?.role === 'DELIVERY_STAFF' && (
                <Link to="/delivery" className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs">
                  <Bike className="w-4 h-4 text-gold-300" />
                  <span>Delivery Orders</span>
                </Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* User Dropdown / Login */}
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-cream-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-maroon-100 text-maroon-800 border border-maroon-200 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-cream-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2.5 border-b border-cream-100">
                        <p className="text-xs text-charcoal-600">Signed in as</p>
                        <p className="text-sm font-bold text-maroon-900 truncate">{user.name}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cream-200 text-maroon-800">
                          {user.role.replace('_', ' ')}
                        </span>
                        {user.role === 'CUSTOMER' && user.loyaltyPoints !== undefined && (
                          <div className="mt-2 flex items-center justify-between text-xs bg-gold-50 p-2 rounded-lg text-gold-900 border border-gold-200">
                            <span className="flex items-center space-x-1">
                              <Award className="w-3.5 h-3.5 text-gold-600" />
                              <span>Royal Points</span>
                            </span>
                            <span className="font-bold">{user.loyaltyPoints} pts</span>
                          </div>
                        )}
                      </div>

                      <div className="py-1">
                        {user.role === 'CUSTOMER' && (
                          <>
                            <Link
                              to="/orders"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-cream-50"
                            >
                              <ShoppingBag className="w-4 h-4 text-maroon-800" />
                              <span>My Past Orders</span>
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-cream-50"
                            >
                              <UserIcon className="w-4 h-4 text-maroon-800" />
                              <span>Profile & Security</span>
                            </Link>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            navigate('/login');
                          }}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left border-t border-cream-100 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-maroon-900 bg-cream-100 hover:bg-cream-200 border border-cream-300 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}

              {/* Cart Button (Only for Customers / Unauthenticated) */}
              {(!user || user.role === 'CUSTOMER') && (
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-maroon-950 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  <ShoppingBag className="w-5 h-5 text-gold-300" />
                  <span className="hidden sm:inline text-xs font-bold">Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold-500 text-charcoal-900 text-[11px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-charcoal-800 rounded-lg hover:bg-cream-100"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu — Strictly Role-Based */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-cream-200 px-4 py-4 space-y-3">
            {(!user || user.role === 'CUSTOMER') && (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-cream-100">
                  <span className="text-xs font-bold text-charcoal-700">Ordering Outlet</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOutletModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-xs text-maroon-800 font-bold underline"
                  >
                    {selectedOutlet ? selectedOutlet.name.replace('Hyderabad House - ', '') : 'Select'}
                  </button>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOrderType('DELIVERY')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      orderType === 'DELIVERY' ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-cream-50 text-charcoal-700 border-cream-200'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('PICKUP')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                      orderType === 'PICKUP' ? 'bg-maroon-800 text-white border-maroon-800' : 'bg-cream-50 text-charcoal-700 border-cream-200'
                    }`}
                  >
                    Takeaway
                  </button>
                </div>

                <div className="pt-2 space-y-2 text-sm font-medium">
                  <Link
                    to="/#menu"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-charcoal-800 hover:text-maroon-800 font-semibold"
                  >
                    Full Menu
                  </Link>
                  <Link
                    to="/outlets"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-charcoal-800 hover:text-maroon-800 font-semibold"
                  >
                    All 17 Outlets
                  </Link>
                  <Link
                    to="/party-orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-charcoal-800 hover:text-maroon-800 font-semibold"
                  >
                    Party & Bulk Catering
                  </Link>
                  <Link
                    to="/track"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-charcoal-800 hover:text-maroon-800 font-semibold"
                  >
                    Live Order Tracking
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-charcoal-800 hover:text-maroon-800 font-semibold"
                  >
                    My Past Orders
                  </Link>
                </div>
              </>
            )}

            {user?.role === 'KITCHEN_STAFF' && (
              <div className="space-y-2">
                <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Workspace</span>
                  <span className="text-xs font-bold text-maroon-950">Kitchen KDS Station</span>
                </div>
                <Link
                  to="/kitchen"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-maroon-900 font-bold"
                >
                  Open Kitchen KDS Display
                </Link>
              </div>
            )}

            {user?.role === 'OUTLET_MANAGER' && (
              <div className="space-y-2">
                <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Workspace</span>
                  <span className="text-xs font-bold text-maroon-950">Outlet Operations</span>
                </div>
                <Link
                  to="/manager"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-maroon-900 font-bold"
                >
                  Outlet Manager Panel
                </Link>
                <Link
                  to="/kitchen"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-charcoal-700 font-medium"
                >
                  Kitchen KDS
                </Link>
              </div>
            )}

            {user?.role === 'CENTRAL_ADMIN' && (
              <div className="space-y-2">
                <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 block">Workspace</span>
                  <span className="text-xs font-bold text-maroon-950">Central Administration</span>
                </div>
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-maroon-900 font-bold"
                >
                  Admin HQ Analytics & Controls
                </Link>
                <Link
                  to="/outlets"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-charcoal-700 font-medium"
                >
                  All 17 Outlets Master
                </Link>
              </div>
            )}

            {user?.role === 'DELIVERY_STAFF' && (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Workspace</span>
                  <span className="text-xs font-bold text-emerald-950">Delivery Dispatch Station</span>
                </div>
                <Link
                  to="/delivery"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-emerald-900 font-bold"
                >
                  Delivery Orders Console
                </Link>
              </div>
            )}

            {/* User Session Row on Mobile */}
            <div className="pt-3 border-t border-cream-200">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-charcoal-500 block">Signed in as</span>
                    <strong className="text-xs text-maroon-950">{user?.name}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="py-1.5 px-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center bg-maroon-900 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Outlet Selector Modal */}
      <OutletSelectorModal
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
      />
    </>
  );
};
