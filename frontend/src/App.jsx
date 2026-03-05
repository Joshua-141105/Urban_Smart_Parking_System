import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/driver/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import FindParking from "./pages/driver/FindParking";
import MyBookings from "./pages/driver/MyBookings";
import Permits from "./pages/driver/Permits";
import PaymentPage from "./pages/driver/PaymentPage";
import BookingPayment from "./pages/driver/BookingPayment";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import CityDashboard from "./pages/admin/CityDashboard";
import NavigationPage from "./pages/driver/NavigationPage";
import NotificationsPage from "./pages/driver/NotificationsPage";
import ParkingLotManagement from "./pages/admin/ParkingLotManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import UserProfile from "./pages/driver/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full animate-spin"
            style={{ border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)' }}>
          </div>
          <p className="text-accent text-lg font-medium">Loading ParkVerse...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<Home />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Public Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/find-parking" element={<FindParking />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Driver Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/permits" element={<Permits />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/booking/:lotId" element={<BookingPayment />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* Parking Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={["PARKING_MANAGER", "SYSTEM_ADMIN"]} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          </Route>

          {/* Admin / City Authority Routes */}
          <Route element={<ProtectedRoute allowedRoles={["CITY_ADMIN", "SYSTEM_ADMIN"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/city" element={<CityDashboard />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/parking-lots" element={<ParkingLotManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
