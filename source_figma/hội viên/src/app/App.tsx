import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { MemberSidebar } from './components/MemberSidebar';
import { Dashboard } from './screens/Dashboard';
import { MyPackageNew } from './screens/MyPackageNew';
import { MyScheduleNew } from './screens/MyScheduleNew';
import { Trainers } from './screens/Trainers';
import { TrainerDetail } from './screens/TrainerDetail';
import { RateService } from './screens/RateService';
import { AccountPage } from './screens/AccountPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <MemberSidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/my-package" element={<MyPackageNew />} />
            <Route path="/my-schedule" element={<MyScheduleNew />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/trainer-detail/:id" element={<TrainerDetail />} />
            <Route path="/rate-service" element={<RateService />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Toast Notifications */}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#17181D',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff'
            },
            className: 'toast-custom'
          }}
        />
      </div>
    </BrowserRouter>
  );
}