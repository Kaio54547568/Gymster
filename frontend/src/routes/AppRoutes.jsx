import { Navigate, Route, Routes } from "react-router";
import { useEffect, useState } from "react";
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

function getRouteRole(role) {
  const normalizedRole = String(role || "").toLowerCase();
  if (normalizedRole === "owner") return "admin";
  if (normalizedRole === "trainer") return "pt";
  return normalizedRole;
}

function RoleRoute({ role, currentUser, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (getRouteRole(currentUser.role) !== role) {
    return <Navigate to={getUserHome(currentUser)} replace />;
  }

  return children;
}

function PublicRoute({ currentUser, children }) {
  if (currentUser) {
    return <Navigate to={getUserHome(currentUser)} replace />;
  }

  return children;
}

function FallbackRoute({ currentUser }) {
  return <Navigate to={currentUser ? getUserHome(currentUser) : "/"} replace />;
}

function AppRoutes() {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUserState(getCurrentUser());
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === "gymster_current_user") {
        syncCurrentUser();
      }
    };

    window.addEventListener("gymster:user-updated", syncCurrentUser);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("gymster:user-updated", syncCurrentUser);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute currentUser={currentUser}>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute currentUser={currentUser}>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute currentUser={currentUser}>
            <RegisterPage />
          </PublicRoute>
        }
      />
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
          <RoleRoute role="admin" currentUser={currentUser}>
            <AdminApp />
          </RoleRoute>
        }
      />
      <Route
        path="/staff/*"
        element={
          <RoleRoute role="staff" currentUser={currentUser}>
            <StaffApp />
          </RoleRoute>
        }
      />
      <Route
        path="/pt/*"
        element={
          <RoleRoute role="pt" currentUser={currentUser}>
            <PtApp />
          </RoleRoute>
        }
      />
      <Route
        path="/member/*"
        element={
          <RoleRoute role="member" currentUser={currentUser}>
            <MemberApp />
          </RoleRoute>
        }
      />
      <Route path="*" element={<FallbackRoute currentUser={currentUser} />} />
    </Routes>
  );
}

export default AppRoutes;
