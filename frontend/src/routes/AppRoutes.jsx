import { Navigate, Route, Routes } from "react-router";
import LandingPage from "../pages/Landing/LandingPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import AdminApp from "../roles/admin/App";
import StaffApp from "../roles/staff/App";
import PtApp from "../roles/pt/App";
import MemberApp from "../roles/member/App";
import {
  getCurrentUser,
  getUserHome,
} from "../services/authService";
import {
  MemberOnboardingRoute,
  OnboardingPaymentPage,
  OnboardingSuccessPage,
  PackageSelectionPage,
  RegistrationStatusPage,
  TrainerSelectionPage,
} from "../pages/Onboarding/OnboardingPages";

function RoleRoute({ role, children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (String(currentUser.role || "").toLowerCase() !== role) {
    return <Navigate to={getUserHome(currentUser)} replace />;
  }

  if (role === "member" && currentUser.accountStatus && currentUser.accountStatus !== "Active") {
    return <Navigate to="/onboarding/status" replace />;
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
        path="/onboarding/status"
        element={
          <MemberOnboardingRoute>
            <RegistrationStatusPage />
          </MemberOnboardingRoute>
        }
      />
      <Route
        path="/onboarding/packages"
        element={
          <MemberOnboardingRoute>
            <PackageSelectionPage />
          </MemberOnboardingRoute>
        }
      />
      <Route
        path="/onboarding/trainers"
        element={
          <MemberOnboardingRoute>
            <TrainerSelectionPage />
          </MemberOnboardingRoute>
        }
      />
      <Route
        path="/onboarding/payment"
        element={
          <MemberOnboardingRoute>
            <OnboardingPaymentPage />
          </MemberOnboardingRoute>
        }
      />
      <Route
        path="/onboarding/success"
        element={
          <MemberOnboardingRoute>
            <OnboardingSuccessPage />
          </MemberOnboardingRoute>
        }
      />
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
      <Route
        path="/member/*"
        element={
          <RoleRoute role="member">
            <MemberApp />
          </RoleRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
