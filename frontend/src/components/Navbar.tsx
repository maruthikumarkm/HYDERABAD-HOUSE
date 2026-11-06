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
  Award
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
      case 'CATERING_MANAGER':
        return { label: 'Catering Desk', path: '/catering', icon: Calendar };
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

            {/* Outlet Selector & Order Mode Toggle (Desktop) */}
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

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-charcoal-800">
              <Link to="/#menu" className="hover:text-maroon-800 transition-colors">
                Menu
              </Link>
              <Link to="/outlets" className="hover:text-maroon-800 transition-colors">
                Outlets (17)
              </Link>
              <Link to="/party-orders" className="hover:text-maroon-800 transition-colors flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gold-600" />
                <span>Party Orders</span>
              </Link>
              <Link to="/track" className="hover:text-maroon-800 transition-colors">
                Live Track
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Role Dashboard Quick Link */}
              {dashboard && (
                <Link
                  to={dashboard.path}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-gold-500 to-gold-600 text-charcoal-900 rounded-xl text-xs font-bold shadow-xs hover:brightness-105 transition-all"
                >
                  <dashboard.icon className="w-4 h-4" />
                  <span>{dashboard.label}</span>
                </Link>
              )}

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
                        {user.loyaltyPoints !== undefined && (
                          <div className="mt-2 flex items-center justify-between text-xs bg-gold-50 p-2 rounded-lg text-gold-900 border border-gold-200">
                            <span className="flex items-center space-x-1">
                              <Award className="w-3.5 h-3.5 text-gold-600" />
                              <span>Royal Points</span>
                            </span>
                            <span className="font-bold">{user.loyaltyPoints} pts</span>
                          </div>
                        )}
                      </div>

                      {dashboard && (
                        <Link
                          to={dashboard.path}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-charcoal-800 hover:bg-cream-50"
                        >
                          <dashboard.icon className="w-4 h-4 text-maroon-800" />
                          <span>{dashboard.label}</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-charcoal-800 hover:bg-cream-50"
                      >
                        <UserIcon className="w-4 h-4 text-maroon-800" />
                        <span>My Profile & Account</span>
                      </Link>

                      <Link
                        to="/history"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-charcoal-800 hover:bg-cream-50"
                      >
                        <ShoppingBag className="w-4 h-4 text-maroon-800" />
                        <span>Order History & Reorder</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 text-left border-t border-cream-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
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

              {/* Cart Button */}
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

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-cream-200 px-4 py-4 space-y-3">
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
                className="block py-2 text-charcoal-800 hover:text-maroon-800"
              >
                Full Menu
              </Link>
              <Link
                to="/outlets"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-charcoal-800 hover:text-maroon-800"
              >
                All 17 Outlets
              </Link>
              <Link
                to="/party-orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-charcoal-800 hover:text-maroon-800"
              >
                Party & Bulk Catering
              </Link>
              <Link
                to="/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-charcoal-800 hover:text-maroon-800"
              >
                Live Order Tracking
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-maroon-900 font-bold hover:underline"
                  >
                    My Profile & Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="block w-full text-left py-2 text-red-600 font-bold"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-maroon-900 font-bold"
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
