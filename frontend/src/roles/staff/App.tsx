import { Routes, Route, Navigate } from 'react-router';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { AddMemberUI } from './components/AddMemberUI';
import { MemberList } from './components/MemberList';
import { MemberDetail } from './components/MemberDetail';
import { DailyCheckIn } from './components/DailyCheckIn';
import { RenewPackageUI } from './components/RenewPackageUI';
import { PaymentRequests } from './components/PaymentRequests';
import { ReceiptDetail } from './components/ReceiptDetail';
import { ViewHistoryUI } from './components/ViewHistoryUI';
import { FeedbackManagement } from './components/FeedbackManagement';
import { FeedbackDetail } from './components/FeedbackDetail';
import { EquipmentStatus } from './components/EquipmentStatus';
import { Notifications } from './components/Notifications';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-member" element={<AddMemberUI />} />
          <Route path="members" element={<MemberList />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="check-in" element={<DailyCheckIn />} />
          <Route path="renew-package" element={<RenewPackageUI />} />
          <Route path="renew-package/:memberId" element={<RenewPackageUI />} />
          <Route path="payment-requests" element={<PaymentRequests />} />
          <Route path="receipt/:id" element={<ReceiptDetail />} />
          <Route path="history" element={<ViewHistoryUI />} />
          <Route path="feedback" element={<FeedbackManagement />} />
          <Route path="feedback/:id" element={<FeedbackDetail />} />
          <Route path="equipment" element={<EquipmentStatus />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </div>
  );
}
