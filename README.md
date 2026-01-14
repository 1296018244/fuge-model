# Fuge Habit Builder (福格行为设计助手)

Based on the Fogg Behavior Model, this application helps users design, track, and sustain micro-habits through a scientific approach. It combines a modern React frontend with native Android alarm capabilities to ensure reliable habit triggers.

## ✨ Core Features
- **Behavior Design Wizard**: AI-powered wizard (based on Fogg's method) to help decompose goals into tiny, actionable behaviors.
- **Micro-Habit Dashboard**: Visualize habits, anchors, and celebratory actions.
- **Reliable Reminders**: Native Android Alarm integration (`AlarmManager` + `Foreground Service`) ensures alarms ring even when the screen is locked or the app is closed.
- **Snooze Functionality**: 5-minute snooze option for flexible reminder management.
- **Data Persistence**: Local first architecture continuously synced to Supabase (optional).

## 🛠 Tech Stack
- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Vanilla CSS (Modern Variables & Glassmorphism)
- **Mobile Runtime**: Capacitor 5
- **Native Modules**: Java (Android) - Custom `AlarmModule`, `AlarmService`, `AlarmActivity`
- **State/Storage**: Custom Hooks + Supabase

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18+
- **JDK**: Java Development Kit 17 (Required for Android build)
- **Android SDK**: Standard Android Studio SDK tools

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd fuge-habit-model
npm install
```

### 2. Development (Web)
To run the web version locally:
```bash
npm run dev
```

### 3. Build for Android
To compile the project and generate the Android APK:

**Step A: Build Web Assets**
```bash
npm run build
```

**Step B: Sync with Capacitor**
```bash
npx cap sync
```

**Step C: Build APK (PowerShell / Windows)**
Ensure your `JAVA_HOME` points to JDK 17 (adjust path as needed):
```powershell
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.12.7-hotspot'
cd android
./gradlew clean assembleDebug
```

The APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 Native Features Notes
- **Permissions**: The app requires `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, and `Review Notification` permissions on Android 13+.
- **Vibration**: Custom vibration patterns are implemented in `AlarmService.java`.
- **UI Customization**: The Alarm UI is currently native Java-based (located in `AlarmActivity.java`).

## 📄 License
MIT
