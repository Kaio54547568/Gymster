import { Bell, CheckCircle, AlertTriangle, RefreshCw, UserX, MessageSquare, Wrench } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function Notifications() {
  const notifications: Notification[] = [
    {
      id: 'NOT001',
      type: 'warning',
      title: 'Membership Expiring Soon',
      message: '15 members have packages expiring within 7 days',
      time: '2026-05-06 08:00',
      read: false
    },
    {
      id: 'NOT002',
      type: 'success',
      title: 'Payment Completed',
      message: 'Nguyễn Hoàng Anh (M00123) renewed VIP Elite package - 12,000,000 VND',
      time: '2026-05-06 07:30',
      read: false
    },
    {
      id: 'NOT003',
      type: 'error',
      title: 'Failed Renewal',
      message: 'Trần Minh Đức (M00124) renewal failed - Payment declined',
      time: '2026-05-05 18:45',
      read: false
    },
    {
      id: 'NOT004',
      type: 'warning',
      title: 'Duplicate Member Warning',
      message: 'Attempted to register member with existing phone: 0912345678',
      time: '2026-05-05 16:20',
      read: true
    },
    {
      id: 'NOT005',
      type: 'info',
      title: 'New Feedback Received',
      message: 'Lê Quốc Bảo submitted feedback about treadmill issue',
      time: '2026-05-05 14:30',
      read: true
    },
    {
      id: 'NOT006',
      type: 'error',
      title: 'Equipment Issue Reported',
      message: 'Treadmill X12 #5 reported as broken - High priority',
      time: '2026-05-05 10:15',
      read: true
    },
    {
      id: 'NOT007',
      type: 'success',
      title: 'New Member Added',
      message: 'Phạm Thị Mai (M00126) successfully registered',
      time: '2026-05-04 16:00',
      read: true
    },
    {
      id: 'NOT008',
      type: 'warning',
      title: 'Maintenance Scheduled',
      message: 'Lat Pulldown Machine scheduled for maintenance on 2026-05-08',
      time: '2026-05-04 09:30',
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    const icons = {
      success: CheckCircle,
      warning: AlertTriangle,
      info: Bell,
      error: AlertTriangle
    };
    return icons[type as keyof typeof icons] || Bell;
  };

  const getNotificationStyle = (type: string) => {
    const styles = {
      success: 'bg-primary/10 border-primary/30 text-primary',
      warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
      info: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
      error: 'bg-destructive/10 border-destructive/30 text-destructive'
    };
    return styles[type as keyof typeof styles];
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1552196563-55cd4e45efb3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxub3RpZmljYXRpb24lMjBiZWxsfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Notifications"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div>
              <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">HỆ THỐNG THÔNG BÁO</p>
              <h1 className="text-6xl font-black tracking-tight mb-4">
                <span className="text-primary">THÔNG BÁO</span>
                <br />
                <span className="text-white">HỆ THỐNG</span>
              </h1>
              <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                Nhận thông báo về gia hạn, thanh toán, sự cố thiết bị, phản hồi hội viên và các hoạt động quan trọng khác.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
      <div className="max-w-4xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-primary">{notifications.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Unread</p>
            <p className="text-2xl font-bold text-destructive">{unreadCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Warnings</p>
            <p className="text-2xl font-bold text-yellow-500">
              {notifications.filter(n => n.type === 'warning').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Errors</p>
            <p className="text-2xl font-bold text-destructive">
              {notifications.filter(n => n.type === 'error').length}
            </p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`bg-card border rounded-xl p-6 transition-all hover:border-primary/50 ${
                  notification.read ? 'border-border opacity-80' : 'border-primary/30 shadow-[0_0_20px_rgba(255,0,0,0.1)]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0 ${getNotificationStyle(notification.type)}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)]"></span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.time).toLocaleString('vi-VN')}
                      </p>
                      {!notification.read && (
                        <button className="text-xs text-primary hover:underline">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center">
          <button className="px-6 py-3 border border-border hover:bg-secondary rounded-lg transition-all">
            Load More Notifications
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
