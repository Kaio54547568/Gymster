import { Navigate, Route, Routes } from "react-router";
import LandingPage from "../pages/Landing/LandingPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import AdminApp from "../roles/admin/App";
import StaffApp from "../roles/staff/App";
import PtApp from "../roles/pt/App";
import { getCurrentUser, getRoleHome } from "../services/authService";

function RoleRoute({ role, children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== role) {
    return <Navigate to={getRoleHome(currentUser.role)} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin/*"
        element={
          <RoleRoute role="admin">
            <AdminApp />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/*"
        element={
          <RoleRoute role="staff">
            <StaffApp />
          </RoleRoute>
        }
      />
      <Route
        path="/pt/*"
        element={
          <RoleRoute role="pt">
            <PtApp />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
