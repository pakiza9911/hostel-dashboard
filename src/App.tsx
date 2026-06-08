import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Hostels } from "./pages/Hostels";
import { Rooms } from "./pages/Rooms";
import { Tenants } from "./pages/Tenants";
import { Payments } from "./pages/Payments";
import { Maintenance } from "./pages/Maintenance";
import { Staff } from "./pages/Staff";
import { Settings } from "./pages/Settings";
import { useEffect } from "react";
import { useAuth } from "./stores/authStore";

function AppContent() {
  const { fetchUser } = useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="hostels"
          element={
            <ProtectedRoute roles={["super_admin"]}>
              <Hostels />
            </ProtectedRoute>
          }
        />
        <Route
          path="rooms"
          element={
            <ProtectedRoute roles={["owner", "manager"]}>
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="tenants"
          element={
            <ProtectedRoute roles={["owner", "manager"]}>
              <Tenants />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments"
          element={
            <ProtectedRoute roles={["owner", "manager"]}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="maintenance"
          element={
            <ProtectedRoute roles={["owner", "manager"]}>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff"
          element={
            <ProtectedRoute roles={["super_admin", "owner"]}>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
