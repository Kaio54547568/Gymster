import { Navigate, Routes, Route } from 'react-router';
import Layout from './components/Layout';
import ExecutiveDashboard from './screens/ExecutiveDashboard';
import RevenueAnalytics from './screens/RevenueAnalytics';
import MembershipAnalytics from './screens/MembershipAnalytics';
import StaffManagement from './screens/StaffManagement';
import EquipmentManagement from './screens/EquipmentManagement';
import MaintenanceTracking from './screens/MaintenanceTracking';
import FeedbackSatisfaction from './screens/FeedbackSatisfaction';
import PackagesPayments from './screens/PackagesPayments';
import Settings from './screens/Settings';
import Profile from './screens/Profile';
import RoleNotificationsPage from '../shared/RoleNotificationsPage';
import RoomManagement from './screens/RoomManagement';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route index element={<ExecutiveDashboard />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="revenue" element={<RevenueAnalytics />} />
        <Route path="membership" element={<MembershipAnalytics />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="equipment" element={<EquipmentManagement />} />
        <Route path="maintenance-report" element={<Navigate to="/admin/maintenance-tracking" replace />} />
        <Route path="maintenance-tracking" element={<MaintenanceTracking />} />
        <Route path="feedback" element={<FeedbackSatisfaction />} />
        <Route path="packages" element={<PackagesPayments />} />
        <Route path="notifications" element={<RoleNotificationsPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Layout>
  );
}
