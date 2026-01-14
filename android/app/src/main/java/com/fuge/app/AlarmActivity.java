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

        // Setup UI Programmatically to avoid XML
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(0xFF000000); // Black background
        layout.setPadding(50, 50, 50, 50);

        String titleText = getIntent().getStringExtra("title");
        String bodyText = getIntent().getStringExtra("body");

        TextView title = new TextView(this);
        title.setText(titleText != null ? titleText : "Alarm");
        title.setTextSize(32);
        title.setTextColor(0xFFFFFFFF);
        title.setGravity(Gravity.CENTER);
        layout.addView(title);

        TextView body = new TextView(this);
        body.setText(bodyText != null ? bodyText : "Time to act!");
        body.setTextSize(20);
        body.setTextColor(0xFFCCCCCC);
        body.setGravity(Gravity.CENTER);
        body.setPadding(0, 20, 0, 50);
        layout.addView(body);

        // Initialize AlarmModule for snooze functionality
        AlarmModule alarmModule = new AlarmModule();

        LinearLayout buttonContainer = new LinearLayout(this);
        buttonContainer.setOrientation(LinearLayout.HORIZONTAL);
        buttonContainer.setGravity(Gravity.CENTER);
        buttonContainer.setPadding(0, 40, 0, 0);

        // Snooze Button Style
        android.graphics.drawable.GradientDrawable snoozeBg = new android.graphics.drawable.GradientDrawable();
        snoozeBg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
        snoozeBg.setColor(0x20EAB308); // Semi-transparent yellow
        snoozeBg.setStroke(2, 0xFFEAB308); // Yellow border
        snoozeBg.setCornerRadius(16);

        Button snoozeBtn = new Button(this);
        snoozeBtn.setText("稍后提醒 (5m)");
        snoozeBtn.setTextSize(18);
        snoozeBtn.setPadding(40, 20, 40, 20);
        snoozeBtn.setTextColor(0xFFEAB308);
        snoozeBtn.setBackground(snoozeBg);

        // Add margin between buttons
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 0, 30, 0);
        snoozeBtn.setLayoutParams(params);

        snoozeBtn.setOnClickListener(v -> {
            snoozeAlarm();
        });
        buttonContainer.addView(snoozeBtn);

        Button dismissBtn = new Button(this);
        dismissBtn.setText("完成 habit");
        dismissBtn.setTextSize(20);
        dismissBtn.setPadding(30, 20, 30, 20);
        dismissBtn.setTextColor(0xFFFFFFFF);
        dismissBtn.setBackgroundColor(0x00000000); // Transparent
        dismissBtn.setOnClickListener(v -> {
            stopAlarmService();
            finish();
        });
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

        // Reschedule using AlarmModule logic (simplified inline here or reusing module)
        // Since we are in Java/Android Native side, we can direct call AlarmManager
        // logic or reuse AlarmModule if static.
        // AlarmModule methods are not static. Let's replicate the scheduling logic
        // simply here.

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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                // Fallback if permission lost, though unlikely in this flow
                alarmManager.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis,
                        pendingIntent);
            }
        }

        finish();
    }

    private void stopAlarmService() {
        Intent intent = new Intent(this, AlarmService.class);
        intent.setAction("STOP_ALARM");
        startService(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Optional: stop service if activity is destroyed (e.g. back button)
        // For alarm, usually better to force user to click Dismiss, but standard
        // behavior
        // is closing the UI might allow the alarm to snooze or stop.
        // Let's stop it to be safe and avoid endless ringing if user force-closes UI.
    }
}
