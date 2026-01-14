# Fuge Habit Builder (福格行为设计助手)

基于福格行为模型 (Fogg Behavior Model)，本项目帮助用户通过科学的方法设计、追踪并坚持微习惯。它结合了现代化的 React 前端与原生 Android 闹钟能力，确保即使在锁屏或后台运行状态下，习惯提醒也能准时且可靠。

## ✨ 核心特性
- **行为设计向导**: 基于福格方法的 AI 向导，帮助你将宏大目标拆解为微小的、立即由锚点触发的可执行行为。
- **微习惯看板**: 可视化管理所有习惯、锚点时刻以及庆祝动作。
- **可靠的提醒机制**: 集成原生 Android 闹钟 (`AlarmManager` + `Foreground Service`)，确保闹钟在锁屏、杀后台等极端情况下依然能稳定响铃。
- **贪睡功能**: 支持 5 分钟“贪睡”模式，提供灵活的提醒缓冲。
- **数据持久化**: 采用本地优先架构，同时支持数据同步到 Supabase (可选)。

## 🛠 技术栈
- **前端**: React 18, Vite, TypeScript
- **样式**: Vanilla CSS (使用现代 CSS 变量 & 玻璃拟态设计)
- **移动端运行时**: Capacitor 5
- **原生模块**: Java (Android) - 自定义实现的 `AlarmModule`, `AlarmService`, `AlarmActivity`
- **状态/存储**: Custom Hooks + Supabase

## 🚀 安装与设置指南

### 前置要求
- **Node.js**: v18+
- **JDK**: Java Development Kit 17 (Android 构建必需)
- **Android SDK**: 标准 Android Studio SDK 工具

### 1. 克隆与安装
```bash
git clone <your-repo-url>
cd fuge-habit-model
npm install
```

### 2. 本地开发 (Web 模式)
在浏览器中运行调试：
```bash
npm run dev
```

### 3. 构建 Android 版本
编译项目并生成 Android APK 安装包：

**步骤 A: 构建 Web 资源**
```bash
npm run build
```

**步骤 B: 同步资源到 Capacitor**
```bash
npx cap sync
```

**步骤 C: 构建 APK (PowerShell / Windows)**
确保你的 `JAVA_HOME` 指向 JDK 17 (请根据实际路径调整):
```powershell
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.12.7-hotspot'
cd android
./gradlew clean assembleDebug
```

构建完成后，APK 文件将位于：
`android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 原生功能说明
- **权限管理**: Android 13+ 需要授予 `SCHEDULE_EXACT_ALARM` (精确闹钟), `USE_FULL_SCREEN_INTENT` (全屏通知) 等权限。
- **震动反馈**: 在 `AlarmService.java` 中实现了自定义的“强力脉冲”震动模式 (`0.8s` 震 / `0.4s` 停)。
- **界面定制**: 闹钟唤醒界面目前使用原生 Java 代码构建 (位于 `AlarmActivity.java`)，以确保性能和稳定性。

## 📄 许可证
MIT
