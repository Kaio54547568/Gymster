import { AlertTriangle, Bell, CheckCheck, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';
import { useRoleNotifications, type RoleNotification } from './notificationStore';
import { openMedicalHistoryForm } from '../../services/medicalHistoryApi';

type NotificationFilter = 'all' | 'unread';

const filterCopy: Record<NotificationFilter, string> = {
  all: 'All',
  unread: 'Unread',
};

export default function RoleNotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useRoleNotifications();

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((notification) => !notification.read) : notifications;

  const getNotificationIcon = (type: RoleNotification['type']) => {
    if (type === 'success') return CheckCircle;
    if (type === 'error') return X;
    if (type === 'info') return Info;
    return AlertTriangle;
  };

  const getNotificationStyle = (type: RoleNotification['type']) => {
    if (type === 'success') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (type === 'error') return 'bg-destructive/10 border-destructive/30 text-destructive';
    if (type === 'info') return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">Notification center</p>
            <h1 className="text-4xl font-black tracking-tight text-white">Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review package, payment, workout, equipment, and other important updates.
            </p>
          </div>

          <button
            type="button"
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5">
            <p className="mb-1 text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-black text-primary">{notifications.length}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5">
            <p className="mb-1 text-sm text-muted-foreground">Unread</p>
            <p className="text-3xl font-black text-destructive">{unreadCount}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5">
            <p className="mb-1 text-sm text-muted-foreground">Warnings</p>
            <p className="text-3xl font-black text-yellow-400">
              {notifications.filter((notification) => notification.type === 'warning').length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5">
            <p className="mb-1 text-sm text-muted-foreground">Errors</p>
            <p className="text-3xl font-black text-destructive">
              {notifications.filter((notification) => notification.type === 'error').length}
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          {(Object.keys(filterCopy) as NotificationFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                filter === item ? 'bg-primary/20 text-primary' : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              {filterCopy[item]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);

              return (
                <article
                  key={notification.id}
                  className={`rounded-2xl border bg-card/80 p-5 transition-all hover:border-primary/50 ${
                    notification.read ? 'border-border/50 opacity-75' : 'border-primary/35 shadow-[0_0_24px_rgba(239,35,60,0.12)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${getNotificationStyle(notification.type)}`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-base font-black text-white">{notification.title}</h2>
                        {!notification.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_rgba(239,35,60,0.8)]" />}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-bold text-primary">{notification.time}</p>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(notification.id)}
                            className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Mark as read
                          </button>
                        )}
                      </div>
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-white/65">
                        {notification.detail}
                      </div>
                      {notification.actionType === 'complete_medical_history' && (
                        <button type="button" onClick={openMedicalHistoryForm} className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-white">
                          Complete medical history
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-border/50 bg-card/80 p-10 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-white/35" />
              <p className="text-sm font-bold text-white/55">No notifications.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
