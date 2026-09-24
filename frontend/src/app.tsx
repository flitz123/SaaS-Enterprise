import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Team from "./pages/Team";
import Billing from "./pages/Billing";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell><Dashboard /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <AppShell><Projects /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="/team" element={<ProtectedRoute><AppShell><Team /></AppShell></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><AppShell><Billing /></AppShell></ProtectedRoute>} />
    </Routes>
  );
}
