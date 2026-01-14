package com.fuge.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("AlarmReceiver", "Alarm received! Starting AlarmService...");

        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String habitId = intent.getStringExtra("habitId");
        int id = intent.getIntExtra("id", 0);

        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        serviceIntent.putExtra("habitId", habitId);
        serviceIntent.putExtra("id", id);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
