package com.fuge.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "AlarmModule")
public class AlarmModule extends Plugin {
    private static final String PREFS_NAME = "FugeAlarmPrefs";
    private static final String KEY_ALARMS = "saved_alarms";

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

            Context context = getContext();
            long time = timestamp.longValue();

            // 持久化闹钟信息
            saveAlarmToPrefs(context, id, time, title, body, habitId);

            // 设置闹钟
            boolean success = scheduleAlarm(context, id, time, title, body, habitId);

            if (success) {
                call.resolve();
                Log.d("AlarmModule", "Alarm set for: " + time + " ID: " + id);
            } else {
                call.reject("Failed to set alarm");
            }
        } catch (Exception e) {
            Log.e("AlarmModule", "Error setting alarm", e);
            call.reject("Error setting alarm: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        try {
            Integer id = call.getInt("id", 1);
            Context context = getContext();

            // 从 SharedPreferences 中移除
            removeAlarmFromPrefs(context, id);

            // 取消系统闹钟
            Intent intent = new Intent(context, AlarmReceiver.class);
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context, id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                alarmManager.cancel(pendingIntent);
            }

            call.resolve();
            Log.d("AlarmModule", "Alarm cancelled: " + id);
        } catch (Exception e) {
            Log.e("AlarmModule", "Error cancelling alarm", e);
            call.reject("Error cancelling alarm: " + e.getMessage());
        }
    }

    /**
     * 设置系统闹钟
     */
    public static boolean scheduleAlarm(Context context, int id, long time, String title, String body, String habitId) {
        try {
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("title", title);
            intent.putExtra("body", body);
            intent.putExtra("habitId", habitId);
            intent.putExtra("id", id);
            intent.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context, id, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            if (alarmManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (!alarmManager.canScheduleExactAlarms()) {
                        Log.e("AlarmModule", "SCHEDULE_EXACT_ALARM permission not granted");
                        return false;
                    }
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, time, pendingIntent);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, time, pendingIntent);
                }
                return true;
            }
        } catch (Exception e) {
            Log.e("AlarmModule", "Failed to schedule alarm", e);
        }
        return false;
    }

    /**
     * 保存闹钟信息到 SharedPreferences
     */
    private void saveAlarmToPrefs(Context context, int id, long time, String title, String body, String habitId) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingJson = prefs.getString(KEY_ALARMS, "[]");
            JSONArray alarms = new JSONArray(existingJson);

            // 移除已存在的同 ID 闹钟
            JSONArray updated = new JSONArray();
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("id") != id) {
                    updated.put(alarm);
                }
            }

            // 添加新闹钟
            JSONObject newAlarm = new JSONObject();
            newAlarm.put("id", id);
            newAlarm.put("time", time);
            newAlarm.put("title", title);
            newAlarm.put("body", body);
            newAlarm.put("habitId", habitId);
            updated.put(newAlarm);

            prefs.edit().putString(KEY_ALARMS, updated.toString()).apply();
            Log.d("AlarmModule", "Saved alarm to prefs: " + newAlarm.toString());
        } catch (Exception e) {
            Log.e("AlarmModule", "Failed to save alarm to prefs", e);
        }
    }

    /**
     * 从 SharedPreferences 中移除闹钟
     */
    private void removeAlarmFromPrefs(Context context, int id) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingJson = prefs.getString(KEY_ALARMS, "[]");
            JSONArray alarms = new JSONArray(existingJson);

            JSONArray updated = new JSONArray();
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("id") != id) {
                    updated.put(alarm);
                }
            }

            prefs.edit().putString(KEY_ALARMS, updated.toString()).apply();
        } catch (Exception e) {
            Log.e("AlarmModule", "Failed to remove alarm from prefs", e);
        }
    }

    /**
     * 恢复所有已保存的闹钟（供 BootReceiver 调用）
     */
    public static void restoreAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingJson = prefs.getString(KEY_ALARMS, "[]");
            JSONArray alarms = new JSONArray(existingJson);

            long now = System.currentTimeMillis();
            JSONArray validAlarms = new JSONArray();

            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                int id = alarm.getInt("id");
                long time = alarm.getLong("time");
                String title = alarm.getString("title");
                String body = alarm.getString("body");
                String habitId = alarm.getString("habitId");

                // 只恢复未来的闹钟
                if (time > now) {
                    boolean success = scheduleAlarm(context, id, time, title, body, habitId);
                    if (success) {
                        validAlarms.put(alarm);
                        Log.d("AlarmModule", "Restored alarm: " + id + " at " + time);
                    }
                } else {
                    Log.d("AlarmModule", "Skipped past alarm: " + id);
                }
            }

            // 更新 prefs，移除过期的闹钟
            prefs.edit().putString(KEY_ALARMS, validAlarms.toString()).apply();
            Log.d("AlarmModule", "Restored " + validAlarms.length() + " alarms after boot");
        } catch (Exception e) {
            Log.e("AlarmModule", "Failed to restore alarms", e);
        }
    }
}
