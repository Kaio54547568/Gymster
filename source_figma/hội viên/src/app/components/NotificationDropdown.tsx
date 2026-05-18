import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Calendar, CreditCard, User } from 'lucide-react';
import { useNavigate } from 'react-router';

interface Notification {
  id: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'workout' | 'package' | 'payment' | 'trainer';
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    message: 'Bạn có lịch tập với PT Nam lúc 18:00 hôm nay',
    time: '10 phút trước',
    isRead: false,
    type: 'workout',
    link: '/my-schedule'
  },
  {
    id: 'n2',
    message: 'Gói Gym 6 tháng của bạn còn 30 ngày',
    time: '1 giờ trước',
    isRead: false,
    type: 'package',
    link: '/my-package'
  },
  {
    id: 'n3',
    message: 'Thanh toán gia hạn gói đã thành công',
    time: 'Hôm qua',
    isRead: true,
    type: 'payment',
    link: '/my-package'
  },
  {
    id: 'n4',
    message: 'HLV Lê Thu Hà đã xác nhận lịch tập Yoga',
    time: '2 ngày trước',
    isRead: true,
    type: 'trainer',
    link: '/trainers'
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'workout':
      return <Calendar className="w-4 h-4 text-primary" />;
    case 'package':
      return <Clock className="w-4 h-4 text-orange-400" />;
    case 'payment':
      return <CreditCard className="w-4 h-4 text-green-400" />;
    case 'trainer':
      return <User className="w-4 h-4 text-blue-400" />;
    default:
      return <Bell className="w-4 h-4 text-gray-400" />;
  }
};

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (notificationId: string, link?: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));

    if (link) {
      navigate(link);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-bold">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id, notification.link)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'text-white font-medium' : 'text-gray-300'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
