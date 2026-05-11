import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, User, CreditCard, History, DollarSign, UserCheck, Heart, MessageSquare, RefreshCw, FileText } from 'lucide-react';

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const member = {
    memberId: id || 'M00123',
    fullName: 'Nguyễn Hoàng Anh',
    phoneNum: '0912345678',
    citizenId: '001234567890',
    dateOfBirth: '1995-05-15',
    gender: 'Male',
    address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    note: 'Knee injury - avoid heavy squats',
    status: 'Active',
    registrationDate: '2024-01-15',
    currentPackage: {
      name: 'VIP Elite',
      startDate: '2026-02-15',
      endDate: '2026-08-15',
      price: '12,000,000 VND',
      daysRemaining: 70
    },
    trainer: {
      name: 'PT Minh Tuấn',
      phone: '0909123456',
      specialization: 'Strength Training'
    },
    usageHistory: [
      { date: '2026-05-06', time: '06:30', service: 'Gym Floor', trainer: 'Self-training' },
      { date: '2026-05-05', time: '18:00', service: 'Personal Training', trainer: 'PT Minh Tuấn' },
      { date: '2026-05-04', time: '07:00', service: 'Gym Floor', trainer: 'Self-training' },
      { date: '2026-05-03', time: '19:30', service: 'Group Class - Yoga', trainer: 'PT Lan Anh' }
    ],
    paymentHistory: [
      { date: '2026-02-15', package: 'VIP Elite', amount: '12,000,000 VND', method: 'Bank Transfer', status: 'Paid' },
      { date: '2025-08-15', package: 'Premium 6 tháng', amount: '6,500,000 VND', method: 'Cash', status: 'Paid' },
      { date: '2025-02-15', package: 'Gym 3 tháng', amount: '3,200,000 VND', method: 'Cash', status: 'Paid' }
    ],
    feedback: [
      { date: '2026-04-20', content: 'PT Minh Tuấn rất nhiệt tình và chuyên nghiệp', status: 'Resolved' },
      { date: '2026-03-10', content: 'Máy chạy bộ số 5 bị lỗi', status: 'Resolved' }
    ]
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/staff/members')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Members
        </button>

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-destructive rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.4)]">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{member.fullName}</h1>
                <p className="text-muted-foreground">Member ID: <span className="text-primary font-mono">{member.memberId}</span></p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium border border-primary/30">
                    {member.status}
                  </span>
                  <span className="px-3 py-1 bg-secondary text-foreground rounded-full text-sm">
                    {member.currentPackage.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/renew-package/${member.memberId}`}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Renew Package
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info & Package */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{member.phoneNum}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Citizen ID</p>
                  <p className="font-medium font-mono">{member.citizenId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{new Date(member.dateOfBirth).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{member.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{member.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{new Date(member.registrationDate).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>

            {/* Current Package */}
            <div className="bg-gradient-to-br from-card to-secondary border border-primary/30 rounded-xl p-6 shadow-[0_0_30px_rgba(255,0,0,0.15)]">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Membership Package
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Package Name</p>
                  <p className="text-xl font-bold text-primary">{member.currentPackage.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(member.currentPackage.startDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{new Date(member.currentPackage.endDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="text-2xl font-bold text-primary">{member.currentPackage.daysRemaining} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-bold">{member.currentPackage.price}</p>
                </div>
              </div>
            </div>

            {/* Medical Note */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Medical Note
              </h3>
              <p className="text-sm bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive">
                {member.note}
              </p>
            </div>

            {/* Assigned Trainer */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Assigned Trainer
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{member.trainer.name}</p>
                <p className="text-sm text-muted-foreground">{member.trainer.phone}</p>
                <p className="text-sm text-primary">{member.trainer.specialization}</p>
              </div>
            </div>
          </div>

          {/* Right Column - History & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Usage History */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Usage History
                </h3>
                <Link to="/staff/history" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {member.usageHistory.map((usage, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">{usage.service}</p>
                      <p className="text-sm text-muted-foreground">{usage.trainer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(usage.date).toLocaleDateString('vi-VN')}</p>
                      <p className="text-sm text-muted-foreground">{usage.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Payment History
              </h3>
              <div className="space-y-3">
                {member.paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">{payment.package}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString('vi-VN')} • {payment.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{payment.amount}</p>
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">{payment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback History */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Feedback History
              </h3>
              <div className="space-y-3">
                {member.feedback.map((fb, index) => (
                  <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{new Date(fb.date).toLocaleDateString('vi-VN')}</p>
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">{fb.status}</span>
                    </div>
                    <p className="text-sm">{fb.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
