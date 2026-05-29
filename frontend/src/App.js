import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import LandingPage from "./components/Public/LandingPage";
import SOSForm from "./components/Public/SOSForm";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import AnalyticsPage from "./components/Analytics/AnalyticsPage";
import ResponderPanel from "./components/Responder/ResponderPanel";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

const App = () => {
  const { user, token } = useSelector((state) => state.auth);

  // Redirect logged-in users to their dashboard
  const getHomeRoute = () => {
    if (!token) return <LandingPage />;
    if (user?.role === "admin" || user?.role === "responder") return <Navigate to="/dashboard" />;
    if (user?.role === "analyst") return <Navigate to="/analytics" />;
    return <LandingPage />;
  };

  return (
    <Router>
      <Routes>

        {/* Landing page with SOS + login/signup */}
        <Route path="/" element={getHomeRoute()} />

        {/* Public SOS form standalone */}
        <Route path="/sos" element={<SOSForm />} />

        {/* Auth */}
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/dashboard" /> : <Signup />}
        />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "responder", "analyst"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin", "analyst"]}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/responder"
          element={
            <ProtectedRoute allowedRoles={["admin", "responder"]}>
              <ResponderPanel />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
};

export default App;