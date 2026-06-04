import { useEffect, useMemo, useState } from 'react';
import {
  getNotificationsForCurrentUser,
  markAllNotificationsReadInSupabase,
  markNotificationReadInSupabase,
} from '../../services/notificationApi';

export type RoleNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  read?: boolean;
  detail?: string;
  actionType?: string;
  actionPayload?: Record<string, unknown>;
};

const NOTIFICATION_CHANGE_EVENT = 'gymster-role-notifications-change';

export const DEFAULT_ROLE_NOTIFICATIONS: RoleNotification[] = [];

export function useRoleNotifications(baseNotifications: RoleNotification[] = DEFAULT_ROLE_NOTIFICATIONS) {
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await getNotificationsForCurrentUser();

      if (!isMounted) return;

      if (error) {
        setNotifications(baseNotifications);
        setErrorMessage(error.message || 'Notifications could not be loaded.');
      } else {
        setNotifications(data);
        setErrorMessage('');
      }

      setIsLoading(false);
    };

    loadNotifications();

    window.addEventListener(NOTIFICATION_CHANGE_EVENT, loadNotifications);

    return () => {
      isMounted = false;
      window.removeEventListener(NOTIFICATION_CHANGE_EVENT, loadNotifications);
    };
  }, [baseNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const notifyChanged = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
    }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    const { error } = await markNotificationReadInSupabase(id);

    if (error) {
      setErrorMessage(error.message || 'Notifications could not be updated.');
      return;
    }

    notifyChanged();
  };

  const markAllNotificationsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    const { error } = await markAllNotificationsReadInSupabase();

    if (error) {
      setErrorMessage(error.message || 'Notifications could not be updated.');
      return;
    }

    notifyChanged();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    errorMessage,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
