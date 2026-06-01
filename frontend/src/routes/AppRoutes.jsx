import { Navigate, Route, Routes, useLocation } from "react-router";
import { useEffect, useState } from "react";
import LandingPage from "../pages/Landing/LandingPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import AuthCallbackPage from "../pages/Auth/AuthCallbackPage";
import SocialProfilePage from "../pages/Auth/SocialProfilePage";
import AdminApp from "../roles/admin/App";
import StaffApp from "../roles/staff/App";
import PtApp from "../roles/pt/App";
import MemberApp from "../roles/member/App";
import {
  CURRENT_SESSION_KEY,
  getCurrentUser,
  getUserHome,
  refreshCurrentSession,
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
  const location = useLocation();

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUserState(getCurrentUser());
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === "gymster_current_user" || event.key === CURRENT_SESSION_KEY) {
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

  useEffect(() => {
    setCurrentUserState(refreshCurrentSession());
  }, [location.pathname]);

  useEffect(() => {
    let lastRefreshAt = 0;

    const refreshActiveSession = () => {
      const now = Date.now();
      if (now - lastRefreshAt < 60 * 1000) return;

      lastRefreshAt = now;
      setCurrentUserState(refreshCurrentSession());
    };

    const refreshWhenVisible = () => {
      if (!document.hidden) {
        refreshActiveSession();
      }
    };

    refreshActiveSession();
    window.addEventListener("focus", refreshActiveSession);
    window.addEventListener("pointerdown", refreshActiveSession);
    window.addEventListener("keydown", refreshActiveSession);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshActiveSession);
      window.removeEventListener("pointerdown", refreshActiveSession);
      window.removeEventListener("keydown", refreshActiveSession);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
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
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/auth/complete-profile" element={<SocialProfilePage />} />
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
