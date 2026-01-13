import { useEffect, useCallback, useState } from 'react';

const NOTIFICATION_PERMISSION_KEY = 'fogg_notification_permission';

export const useNotifications = (habits: Array<{
    id: string;
    tiny_behavior: string;
    backup_time?: string;
    last_completed?: string;
}>) => {
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Check if notification permission is granted
    useEffect(() => {
        if ('Notification' in window) {
            setPermissionGranted(Notification.permission === 'granted');
        }
    }, []);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持通知功能');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';
            setPermissionGranted(granted);
            localStorage.setItem(NOTIFICATION_PERMISSION_KEY, granted ? 'true' : 'false');
            return granted;
        } catch (e) {
            console.error('请求通知权限失败', e);
            return false;
        }
    }, []);

    // Check if a habit should be reminded (backup_time matches current time)
    const shouldRemind = useCallback((habit: {
        backup_time?: string;
        last_completed?: string;
    }) => {
        if (!habit.backup_time) return false;

        const now = new Date();
        const [hours, minutes] = habit.backup_time.split(':').map(Number);

        // Check if current time matches backup_time (within same minute)
        if (now.getHours() !== hours || now.getMinutes() !== minutes) {
            return false;
        }

        // Check if already completed today
        if (habit.last_completed) {
            const lastCompleted = new Date(habit.last_completed);
            if (lastCompleted.toDateString() === now.toDateString()) {
                return false; // Already completed today
            }
        }

        return true;
    }, []);

    // Send notification
    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if (!permissionGranted) return;

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        } catch (e) {
            console.error('发送通知失败', e);
        }
    }, [permissionGranted]);

    // Check all habits and send reminders
    const checkReminders = useCallback(() => {
        if (!permissionGranted) return;

        habits.forEach(habit => {
            if (shouldRemind(habit)) {
                sendNotification('🔔 习惯提醒', {
                    body: `是时候完成: ${habit.tiny_behavior}`,
                    tag: habit.id, // Prevent duplicate notifications
                });
            }
        });
    }, [habits, permissionGranted, shouldRemind, sendNotification]);

    // Set up periodic check (every minute)
    useEffect(() => {
        if (!permissionGranted) return;

        // Check immediately
        checkReminders();

        // Check every minute
        const interval = setInterval(checkReminders, 60000);

        return () => clearInterval(interval);
    }, [permissionGranted, checkReminders]);

    return {
        permissionGranted,
        requestPermission,
        sendNotification,
    };
};
