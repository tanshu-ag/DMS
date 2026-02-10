import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DayView from "@/pages/DayView";
import MonthView from "@/pages/MonthView";
import YearView from "@/pages/YearView";
import Appointment from "@/pages/Appointment";
import History from "@/pages/History";
import Vehicles from "@/pages/Vehicles";
import NewAppointment from "@/pages/NewAppointment";
import AppointmentDetail from "@/pages/AppointmentDetail";
import SettingsOverview from "@/pages/SettingsOverview";
import OtherSettings from "@/pages/OtherSettings";
import Branches from "@/pages/Branches";
import Roles from "@/pages/Roles";
import UserManagement from "@/pages/UserManagement";
import ComingSoon from "@/pages/ComingSoon";
import Layout from "@/components/Layout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialUser = location.state?.user || null;
  const [isAuthenticated, setIsAuthenticated] = useState(initialUser ? true : null);
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (initialUser) {
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [initialUser, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* Old routes redirect to new Appointment page */}
        <Route path="day" element={<Navigate to="/customer-relations/appointment?view=today" replace />} />
        <Route path="month" element={<Navigate to="/customer-relations/appointment?view=month" replace />} />
        <Route path="year" element={<Navigate to="/customer-relations/appointment?view=year" replace />} />
        {/* New Customer Relations routes */}
        <Route path="customer-relations/appointment" element={<Appointment />} />
        <Route path="customer-relations/vehicles" element={<Vehicles />} />
        <Route path="new-appointment" element={<NewAppointment />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="settings" element={<SettingsOverview />} />
        <Route path="other-settings" element={<OtherSettings />} />
        <Route path="branches" element={<Branches />} />
        <Route path="roles" element={<Roles />} />
        <Route path="users" element={<UserManagement />} />
        {/* Coming Soon module pages */}
        <Route path="module/:module" element={<ComingSoon />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
