import { useState } from 'react';
import { User, Bell, Globe, Save, Shield } from 'lucide-react';

export function Settings() {
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Staff',
    email: 'staff@gymmanager.vn',
    phone: '0909123456',
    role: 'Management Staff'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    memberExpiring: true,
    newFeedback: true,
    equipmentIssues: true,
    paymentCompleted: false
  });

  const [language, setLanguage] = useState('vi');

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXR0aW5ncyUyMGdlYXJ8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Settings"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div>
              <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">TÀI KHOẢN NHÂN VIÊN</p>
              <h1 className="text-6xl font-black tracking-tight mb-4">
                <span className="text-primary">CÀI ĐẶT</span>
                <br />
                <span className="text-white">HỆ THỐNG</span>
              </h1>
              <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                Quản lý thông tin cá nhân, tùy chỉnh thông báo, cài đặt ngôn ngữ và cấu hình tài khoản nhân viên.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Settings */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-destructive rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.4)]">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black">Profile Information</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-input px-4 py-4 rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-input px-4 py-4 rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-input px-4 py-4 rounded-xl border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-muted-foreground">Role</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full bg-secondary/50 px-4 py-4 rounded-xl border border-border cursor-not-allowed font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-destructive text-white rounded-xl hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] transition-all font-bold">
                <Save className="w-5 h-5" />
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-destructive rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.4)]">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'memberExpiring', label: 'Membership Expiring Alerts', desc: 'Alert when memberships are about to expire' },
              { key: 'newFeedback', label: 'New Feedback Notifications', desc: 'Notify when members submit feedback' },
              { key: 'equipmentIssues', label: 'Equipment Issue Alerts', desc: 'Alert when equipment issues are reported' },
              { key: 'paymentCompleted', label: 'Payment Completed', desc: 'Notify when payments are successfully processed' }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-5 bg-secondary/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all">
                <div>
                  <p className="font-bold mb-1">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">{setting.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [setting.key]: !notifications[setting.key as keyof typeof notifications] })}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    notifications[setting.key as keyof typeof notifications]
                      ? 'bg-primary shadow-[0_0_15px_rgba(255,0,0,0.5)]'
                      : 'bg-muted'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                    notifications[setting.key as keyof typeof notifications]
                      ? 'translate-x-7'
                      : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Language Settings */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-destructive rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.4)]">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black">Language Preferences</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
              { code: 'en', name: 'English', flag: '🇺🇸' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  language === lang.code
                    ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(255,0,0,0.3)] scale-105'
                    : 'border-border hover:border-primary/50 hover:scale-105'
                }`}
              >
                <div className="text-4xl mb-3">{lang.flag}</div>
                <p className={`font-bold text-lg ${language === lang.code ? 'text-primary' : ''}`}>{lang.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Staff Permissions Notice */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-primary/10 to-destructive/10 border border-primary/30 rounded-2xl p-8 shadow-[0_8px_32px_rgba(255,0,0,0.2)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Staff Account Permissions</h3>
              <p className="text-muted-foreground mb-3">
                You are logged in as <span className="font-bold text-primary">Management Staff</span>. This account has operational permissions for daily gym management tasks.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Member management and registration</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Package renewals and payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Feedback and equipment management</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Usage history and reporting</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                For security settings, password changes, or permission modifications, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
