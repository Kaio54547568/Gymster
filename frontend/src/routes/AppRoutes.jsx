import { Navigate, Route, Routes } from "react-router";
import LoginPage from "../pages/Auth/LoginPage";
import OwnerLayout from "../components/layout/OwnerLayout";
import DashboardPage from "../pages/Owner/DashboardPage";
import MembersPage from "../pages/Owner/MembersPage";
import EquipmentPage from "../pages/Owner/EquipmentPage";
import StaffPage from "../pages/Owner/StaffPage";
import FeedbackPage from "../pages/Owner/FeedbackPage";
import ReportsPage from "../pages/Owner/ReportsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/owner" element={<OwnerLayout />}>
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;