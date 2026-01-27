import "@/index.css";
import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import CommandCenter from "./pages/CommandCenter";
import WorkspaceOverview from "./pages/WorkspaceOverview";
import ExperimentsPage from "./pages/ExperimentsPage";
import CreativeOSPage from "./pages/CreativeOSPage";
import DistributionPage from "./pages/DistributionPage";
import CreatorsPage from "./pages/CreatorsPage";
import MeasurementPage from "./pages/MeasurementPage";
import ReportsPage from "./pages/ReportsPage";
import ClientPortal from "./pages/ClientPortal";
import AdminPage from "./pages/AdminPage";
import FunnelBuilder from "./pages/FunnelBuilder";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Configure axios to include auth token in all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth context
export const AuthContext = React.createContext(null);

// Auth Callback Component - handles Google OAuth redirect
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionId = new URLSearchParams(hash.replace("#", "?")).get("session_id");

      if (!sessionId) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        navigate("/", { state: { user: response.data } });
      } catch (error) {
        console.error("Auth failed:", error);
        navigate("/login");
      }
    };

    processAuth();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Authenticating...</div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip if user passed from AuthCallback
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('session_token');
        setIsAuthenticated(false);
        navigate("/login");
      }
    };

    checkAuth();
  }, [location, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<CommandCenter />} />
                <Route path="/workspace/:workspaceId" element={<WorkspaceOverview />} />
                <Route path="/workspace/:workspaceId/experiments" element={<ExperimentsPage />} />
                <Route path="/workspace/:workspaceId/creative" element={<CreativeOSPage />} />
                <Route path="/workspace/:workspaceId/distribution" element={<DistributionPage />} />
                <Route path="/workspace/:workspaceId/creators" element={<CreatorsPage />} />
                <Route path="/workspace/:workspaceId/measurement" element={<MeasurementPage />} />
                <Route path="/workspace/:workspaceId/funnel" element={<FunnelBuilder />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/client/:workspaceId" element={<ClientPortal />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Import React for createContext
import React from "react";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
      {/* Grain overlay for texture */}
      <div className="grain-overlay" />
    </div>
  );
}

export default App;
