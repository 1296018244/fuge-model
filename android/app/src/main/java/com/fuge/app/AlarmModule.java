package com.fuge.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmModule")
public class AlarmModule extends Plugin {

    @PluginMethod
    public void setAlarm(PluginCall call) {
        try {
            String timestampStr = call.getString("timestamp");
            String title = call.getString("title", "Alarm");
            String body = call.getString("body", "Time to wake up!");
            String habitId = call.getString("habitId", "0");
            Integer id = call.getInt("id", 1);

            if (timestampStr == null) {
                call.reject("Timestamp is required");
                return;
            }

            Double timestamp;
            try {
                timestamp = Double.valueOf(timestampStr);
            } catch (NumberFormatException e) {
                call.reject("Invalid timestamp format");
                return;
            }

            // Create the intent that will trigger the receiver
            Context context = getContext();
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("title", title);
            intent.putExtra("body", body);
            intent.putExtra("habitId", habitId);
            intent.putExtra("id", id);
            intent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    id,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            if (alarmManager != null) {
                long time = timestamp.longValue();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (!alarmManager.canScheduleExactAlarms()) {
                        call.reject("Permission SCHEDULE_EXACT_ALARM not granted");
                        return;
                    }
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, time, pendingIntent);
                }

                call.resolve();
                Log.d("AlarmModule", "Alarm set for: " + time + " ID: " + id);
            } else {
                call.reject("AlarmManager not available");
            }
        } catch (Exception e) {
            Log.e("AlarmModule", "Error setting alarm", e);
            call.reject("Error setting alarm: " + e.getMessage());
        }
    }
}
