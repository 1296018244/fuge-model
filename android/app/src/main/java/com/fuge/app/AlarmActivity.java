package com.fuge.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class AlarmActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Wake up screen and unlock
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON);
        }

        // Modern Dark Theme UI
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        // Deep blue-black background (Slate 950-ish)
        layout.setBackgroundColor(0xFF0F172A);
        layout.setPadding(60, 60, 60, 60);

        String titleText = getIntent().getStringExtra("title");
        String bodyText = getIntent().getStringExtra("body");
        // Remove alarm from prefs since it has rung (so it doesn't auto-restore if boot
        // loop)
        // Ideally we keep it until dismissed, but for now assuming ring = consumed.
        // Actually, if we crash here, we might want it back. But let's leave it for
        // now.
        int id = getIntent().getIntExtra("id", 0);
        removeAlarmFromPrefs(this, id);

        // Icon or Top Decoration
        TextView iconView = new TextView(this);
        iconView.setText("🔔");
        iconView.setTextSize(64);
        iconView.setGravity(Gravity.CENTER);
        iconView.setPadding(0, 0, 0, 40);
        layout.addView(iconView);

        TextView title = new TextView(this);
        title.setText(titleText != null ? titleText : "微习惯提醒");
        title.setTextSize(28);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setTextColor(0xFFF1F5F9); // Slate 100
        title.setGravity(Gravity.CENTER);
        layout.addView(title);

        TextView body = new TextView(this);
        body.setText(bodyText != null ? bodyText : "该行动了！小习惯，大改变。");
        body.setTextSize(18);
        body.setTextColor(0xFF94A3B8); // Slate 400
        body.setGravity(Gravity.CENTER);
        body.setPadding(0, 20, 0, 80);
        layout.addView(body);

        // Buttons Container
        LinearLayout buttonContainer = new LinearLayout(this);
        buttonContainer.setOrientation(LinearLayout.VERTICAL);
        buttonContainer.setGravity(Gravity.CENTER);
        buttonContainer.setPadding(0, 20, 0, 0);

        // Snooze Button
        android.graphics.drawable.GradientDrawable snoozeBg = new android.graphics.drawable.GradientDrawable();
        snoozeBg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
        snoozeBg.setColor(0x20EAB308); // Transparent Yellow
        snoozeBg.setStroke(3, 0xFFEAB308); // Yellow Border
        snoozeBg.setCornerRadius(24);

        Button snoozeBtn = new Button(this);
        snoozeBtn.setText("💤 稍后提醒 (5分钟)");
        snoozeBtn.setTextSize(16);
        snoozeBtn.setPadding(60, 30, 60, 30);
        snoozeBtn.setTextColor(0xFFEAB308);
        snoozeBtn.setBackground(snoozeBg);
        snoozeBtn.setOnClickListener(v -> snoozeAlarm());

        LinearLayout.LayoutParams snoozeParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        snoozeParams.setMargins(0, 0, 0, 40);
        snoozeBtn.setLayoutParams(snoozeParams);
        buttonContainer.addView(snoozeBtn);

        // Dismiss Button (Primary Action)
        android.graphics.drawable.GradientDrawable dismissBg = new android.graphics.drawable.GradientDrawable();
        dismissBg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
        dismissBg.setColor(0xFF22C55E); // Green 500
        dismissBg.setCornerRadius(24);

        Button dismissBtn = new Button(this);
        dismissBtn.setText("✨ 完成习惯");
        dismissBtn.setTextSize(18);
        dismissBtn.setTypeface(null, android.graphics.Typeface.BOLD);
        dismissBtn.setPadding(60, 35, 60, 35);
        dismissBtn.setTextColor(0xFFFFFFFF);
        dismissBtn.setBackground(dismissBg);

        // Add subtle shadow effect or elevation if possible (API 21+)
        dismissBtn.setElevation(8f);

        dismissBtn.setOnClickListener(v -> {
            stopAlarmService();
            // TODO: Ideally we could trigger a "Mark Done" intent to the main app here?
            // For now just close, user opens app to check.
            finish();
        });

        LinearLayout.LayoutParams dismissParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        dismissBtn.setLayoutParams(dismissParams);
        buttonContainer.addView(dismissBtn);

        layout.addView(buttonContainer);
        setContentView(layout);
    }

    private void snoozeAlarm() {
        stopAlarmService();

        // Calculate time 5 minutes from now
        long triggerAtMillis = System.currentTimeMillis() + 5 * 60 * 1000;

        // Get original intent data to reschedule
        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");
        String habitId = getIntent().getStringExtra("habitId");
        int id = getIntent().getIntExtra("id", 0);

        // PERSISTENCE FIX: Save to SharedPreferences so it survives reboot
        saveAlarmToPrefs(this, id, triggerAtMillis, title, body, habitId);

        Intent intent = new Intent(this, AlarmReceiver.class);
        intent.setAction("ALARM_TRIGGER");
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("habitId", habitId);
        intent.putExtra("id", id);

        android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                this,
                id,
                intent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);

        android.app.AlarmManager alarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis,
                            pendingIntent);
                } else {
                    alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis,
                            pendingIntent);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis,
                        pendingIntent);
            } else {
                alarmManager.setExact(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        }

        finish();
    }

    private void stopAlarmService() {
        Intent intent = new Intent(this, AlarmService.class);
        intent.setAction("STOP_ALARM");
        startService(intent);
    }

    private void saveAlarmToPrefs(Context context, int id, long time, String title, String body, String habitId) {
        try {
            android.content.SharedPreferences prefs = context.getSharedPreferences("FugeAlarmPrefs",
                    Context.MODE_PRIVATE);
            String existingJson = prefs.getString("saved_alarms", "[]");
            org.json.JSONArray alarms = new org.json.JSONArray(existingJson);

            // Remove existing same ID to avoid duplicates
            org.json.JSONArray updated = new org.json.JSONArray();
            for (int i = 0; i < alarms.length(); i++) {
                org.json.JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("id") != id) {
                    updated.put(alarm);
                }
            }

            // Add new alarm
            org.json.JSONObject newAlarm = new org.json.JSONObject();
            newAlarm.put("id", id);
            newAlarm.put("time", time);
            newAlarm.put("title", title);
            newAlarm.put("body", body);
            newAlarm.put("habitId", habitId);
            updated.put(newAlarm);

            prefs.edit().putString("saved_alarms", updated.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void removeAlarmFromPrefs(Context context, int id) {
        try {
            android.content.SharedPreferences prefs = context.getSharedPreferences("FugeAlarmPrefs",
                    Context.MODE_PRIVATE);
            String existingJson = prefs.getString("saved_alarms", "[]");
            org.json.JSONArray alarms = new org.json.JSONArray(existingJson);

            org.json.JSONArray updated = new org.json.JSONArray();
            for (int i = 0; i < alarms.length(); i++) {
                org.json.JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("id") != id) {
                    updated.put(alarm);
                }
            }

            prefs.edit().putString("saved_alarms", updated.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Ensure alarm sound stops if activity is forced closed
        stopAlarmService();
    }
}
