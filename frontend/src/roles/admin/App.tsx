import { Navigate, Routes, Route } from 'react-router';
import Layout from './components/Layout';
import ExecutiveDashboard from './screens/ExecutiveDashboard';
import RevenueAnalytics from './screens/RevenueAnalytics';
import MembershipAnalytics from './screens/MembershipAnalytics';
import StaffManagement from './screens/StaffManagement';
import Scheduling from './screens/Scheduling';
import PerformanceEvaluation from './screens/PerformanceEvaluation';
import Payroll from './screens/Payroll';
import EquipmentManagement from './screens/EquipmentManagement';
import MaintenanceReport from './screens/MaintenanceReport';
import MaintenanceTracking from './screens/MaintenanceTracking';
import FeedbackSatisfaction from './screens/FeedbackSatisfaction';
import ReportsStatistics from './screens/ReportsStatistics';
import PackagesPayments from './screens/PackagesPayments';
import Settings from './screens/Settings';
import Profile from './screens/Profile';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route index element={<ExecutiveDashboard />} />
        <Route path="revenue" element={<RevenueAnalytics />} />
        <Route path="membership" element={<MembershipAnalytics />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="scheduling" element={<Scheduling />} />
        <Route path="performance" element={<PerformanceEvaluation />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="equipment" element={<EquipmentManagement />} />
        <Route path="maintenance-report" element={<MaintenanceReport />} />
        <Route path="maintenance-tracking" element={<MaintenanceTracking />} />
        <Route path="feedback" element={<FeedbackSatisfaction />} />
        <Route path="reports" element={<ReportsStatistics />} />
        <Route path="packages" element={<PackagesPayments />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Layout>
  );
}
