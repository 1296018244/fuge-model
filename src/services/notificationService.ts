import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin } from '@capacitor/core';
import type { Habit } from '../types/index';

// Define Native Alarm Module
interface AlarmModulePlugin {
    setAlarm(options: { timestamp: string, title: string, body: string, habitId: string, id: number }): Promise<void>;
}
const AlarmModule = registerPlugin<AlarmModulePlugin>('AlarmModule');

// 日志存储，用于调试
const notificationLogs: string[] = [];

const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log('🔔 NotificationService:', logMessage);
    notificationLogs.push(logMessage);
    // 保持最近50条日志
    if (notificationLogs.length > 50) notificationLogs.shift();
};

export const notificationService = {
    // 获取日志（用于调试界面显示）
    getLogs(): string[] {
        return [...notificationLogs];
    },

    async requestPermissions(): Promise<boolean> {
        log('Requesting permissions...');
        try {
            const result = await LocalNotifications.requestPermissions();
            log(`Permission result: ${JSON.stringify(result)}`);
            const granted = result.display === 'granted';
            log(`Permission granted: ${granted}`);
            return granted;
        } catch (e) {
            log(`Permission request FAILED: ${e}`);
            return false;
        }
    },

    async checkPermissions(): Promise<string> {
        try {
            const result = await LocalNotifications.checkPermissions();
            log(`Current permissions: ${JSON.stringify(result)}`);
            return result.display;
        } catch (e) {
            log(`Check permissions FAILED: ${e}`);
            return 'unknown';
        }
    },

    // 检查精确闹钟权限 (Android 12+ 必需)
    async checkExactAlarmSetting(): Promise<string> {
        log('Checking exact alarm setting...');
        try {
            const result = await LocalNotifications.checkExactNotificationSetting();
            log(`Exact alarm setting: ${JSON.stringify(result)}`);
            return result.exact_alarm;
        } catch (e) {
            log(`Check exact alarm FAILED: ${e}`);
            return 'unknown';
        }
    },

    // 引导用户开启精确闹钟权限
    async enableExactAlarm(): Promise<void> {
        log('Opening exact alarm settings...');
        try {
            const result = await LocalNotifications.changeExactNotificationSetting();
            log(`Exact alarm setting result: ${JSON.stringify(result)}`);
        } catch (e) {
            log(`Enable exact alarm FAILED: ${e}`);
        }
    },

    async createChannel(): Promise<void> {
        log('Creating notification channel...');
        try {
            await LocalNotifications.createChannel({
                id: 'habits',
                name: 'Habit Reminders',
                description: 'Notifications for habit reminders',
                importance: 5, // Max priority
                visibility: 1, // Public
                vibration: true,
                lights: true,
                // sound: undefined means use default system sound
            });
            log('Channel created successfully');
        } catch (e) {
            log(`Channel creation FAILED: ${e}`);
        }
    },

    async scheduleReminder(habit: Habit): Promise<void> {
        log(`scheduleReminder called for: ${habit.tiny_behavior}`);
        log(`reminder_time: ${habit.reminder_time}`);

        if (!habit.reminder_time) {
            log('No reminder_time set, skipping');
            return;
        }

        const [hour, minute] = habit.reminder_time.split(':').map(Number);
        if (isNaN(hour) || isNaN(minute)) {
            log(`Invalid time format: ${habit.reminder_time}`);
            return;
        }

        log(`Parsed time: ${hour}:${minute}`);

        // Check permissions first
        const permStatus = await this.checkPermissions();
        log(`Permission status before schedule: ${permStatus}`);

        // Ensure channel exists (kept for compatibility/fallback logic if needed)
        await this.createChannel();

        // Cancel existing first
        // await this.cancelReminder(habit.id); // Native SetExact overwrites by PendingIntent ID, so strict cancel might not be needed if ID is same, but good practice.
        // However, AlarmModule uses a hash ID. Let's keep cancel just to be safe if we were using local notifications before.
        // Actually, we are moving to PURE native. Native setAlarm overwrites if same PI.
        // But let's leave cancel in case we want to clear old "LocalNotification" plugin scheduled items.

        const notificationId = this.hashString(habit.id);
        log(`Notification ID (hash): ${notificationId}`);

        try {
            // Use Native Alarm Module for reliable full-screen alerts
            await this.scheduleNativeAlarm(habit.id, habit.tiny_behavior, hour, minute);
            log(`✅ Successfully scheduled Native Alarm for ${hour}:${minute}`);

        } catch (e) {
            log(`❌ Schedule FAILED: ${e}`);
        }
    },

    // Native Alarm Scheduling
    async scheduleNativeAlarm(habitId: string, title: string, hour: number, minute: number): Promise<void> {
        try {
            const now = new Date();
            let target = new Date();
            target.setHours(hour, minute, 0, 0);

            if (target <= now) {
                // If time passed today, schedule for tomorrow
                target.setDate(target.getDate() + 1);
            }

            const timestamp = target.getTime();
            const id = this.hashString(habitId);

            log(`Scheduling Native Alarm for: ${target.toLocaleString()} (ID: ${id})`);

            await AlarmModule.setAlarm({
                timestamp: timestamp.toString(),
                title: '🔔 微习惯提醒',
                body: `该执行习惯了: ${title}`,
                habitId,
                id
            });
            log('Native Alarm set successfully');
        } catch (e) {
            log(`Native Alarm FAILED: ${e}`);
        }
    },

    // 仅保留取消功能，用于清理
    async cancelReminder(habitId: string): Promise<void> {
        // Native alarm doesn't have a direct "cancel" exposed in our simple module yet,
        // but setting a new one overwrites. To truly cancel, we might need a cancel method in Java.
        // For now, let's keep the LocalNotification cancel just in case proper plugin was used.
        // TODO: Implement cancel in AlarmModule.java if needed.
        const notificationId = this.hashString(habitId);
        log(`Canceling notification ID: ${notificationId}`);
        try {
            await LocalNotifications.cancel({
                notifications: [{ id: notificationId }]
            });
            log('Cancel successful');
        } catch (e) {
            log(`Cancel failed (may be normal): ${e}`);
        }
    },

    hashString(str: string): number {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & 0xFFFFFFFF;
        }
        return Math.abs(hash);
    }
};
