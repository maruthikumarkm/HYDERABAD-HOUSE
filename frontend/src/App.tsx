import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';

import HomePage from './pages/HomePage';
import OutletsPage from './pages/OutletsPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import PartyOrdersPage from './pages/PartyOrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import KitchenDisplayPage from './pages/KitchenDisplayPage';
import OutletManagerDashboard from './pages/OutletManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CateringDashboard from './pages/CateringDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import ProfilePage from './pages/ProfilePage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RoleAwareHome: React.FC = () => {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'KITCHEN_STAFF') return <Navigate to="/kitchen" replace />;
    if (user.role === 'OUTLET_MANAGER') return <Navigate to="/manager" replace />;
    if (user.role === 'CENTRAL_ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DELIVERY_STAFF') return <Navigate to="/delivery" replace />;
    if (user.role === 'CATERING_MANAGER') return <Navigate to="/kitchen" replace />;
  }
  return <HomePage />;
};

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Customer Routes */}
          <Route path="/" element={<RoleAwareHome />} />
          <Route path="/outlets" element={<OutletsPage />} />
          <Route path="/track" element={<OrderTrackingPage />} />
          <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/my-orders" element={<OrderHistoryPage />} />
          <Route path="/history" element={<OrderHistoryPage />} />
          <Route path="/party-orders" element={<PartyOrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Role-Based Protected Routes */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'OUTLET_MANAGER', 'CENTRAL_ADMIN']}>
                <KitchenDisplayPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['OUTLET_MANAGER', 'CENTRAL_ADMIN']}>
                <OutletManagerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['CENTRAL_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['DELIVERY_STAFF', 'OUTLET_MANAGER', 'CENTRAL_ADMIN']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/catering"
            element={<Navigate to="/kitchen" replace />}
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
