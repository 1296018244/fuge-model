package com.fuge.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private Ringtone ringtone;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FugeApp:AlarmServiceWakelock");
        wakeLock.acquire(10 * 60 * 1000L /* 10 minutes */);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if ("STOP_ALARM".equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String habitId = intent.getStringExtra("habitId");
        int id = intent.getIntExtra("id", 0);

        startForeground(id, buildNotification(title, body, habitId, id));
        startAlarm();

        return START_STICKY;
    }

    private Notification buildNotification(String title, String body, String habitId, int id) {
        String channelId = "execution_alarm";
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Full Screen Alarms",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Critical alerts/alarms");
            channel.enableVibration(true);
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }

        Intent activityIntent = new Intent(this, AlarmActivity.class);
        activityIntent.putExtra("title", title);
        activityIntent.putExtra("body", body);
        activityIntent.putExtra("habitId", habitId);
        activityIntent.putExtra("id", id);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                id,
                activityIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Stop Action
        Intent stopIntent = new Intent(this, AlarmService.class);
        stopIntent.setAction("STOP_ALARM");
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                id,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss / 关闭", stopPendingIntent)
                .setFullScreenIntent(fullScreenPendingIntent, true);

        return builder.build();
    }

    private void startAlarm() {
        // Play Sound
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            ringtone = RingtoneManager.getRingtone(getApplicationContext(), alarmUri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ringtone.setLooping(true);
                }
                ringtone.play();
            }
        } catch (Exception e) {
            Log.e("AlarmService", "Error playing ringtone", e);
        }

        // Vibrate
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                // Pattern: {delay, vibrate, sleep, vibrate, sleep...}
                // Urgent Pulse: 0 delay, 800ms vibe, 400ms sleep
                long[] pattern = { 0, 800, 400 };
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e("AlarmService", "Error vibrating", e);
        }
    }

    private void stopAlarm() {
        if (ringtone != null && ringtone.isPlaying()) {
            ringtone.stop();
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopAlarm();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
