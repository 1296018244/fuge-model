// Force HMR Update
import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react'
import confetti from 'canvas-confetti'
import SettingsModal from './components/SettingsModal'
import HabitDashboard from './components/HabitDashboard'
import ManualEntryModal from './components/ManualEntryModal'
import WeeklyReviewModal from './components/WeeklyReviewModal'
import ScalingSuggestionModal from './components/ScalingSuggestionModal'
import ChainSettingModal from './components/ChainSettingModal'
import RehearsalModal from './components/RehearsalModal'
import Toast from './components/Toast'
// Lazy load heavy components
const BehaviorWizard = lazy(() => import('./components/BehaviorWizard'))
const Heatmap = lazy(() => import('./components/Heatmap'))
import { useHabits } from './hooks/useHabits'
import { useNotifications } from './hooks/useNotifications'
import { Plus, Zap, Sparkles, X, Calendar, Loader } from 'lucide-react'
import { StatusBar, Style } from '@capacitor/status-bar'
import './App.css'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Creation Modes
  const [isCreatorOpen, setIsCreatorOpen] = useState(false); // The FAB menu
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Weekly Review
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [weeklyBannerDismissed, setWeeklyBannerDismissed] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; subMessage?: string; emoji?: string } | null>(null);

  // Scaling suggestion modal state
  const [scalingModal, setScalingModal] = useState<{ isOpen: boolean; habitId: string; habitName: string; failures: number; suggestion?: string }>({ isOpen: false, habitId: '', habitName: '', failures: 0 });

  // Chain setting modal state
  const [chainModal, setChainModal] = useState<{ isOpen: boolean; habitId: string }>({ isOpen: false, habitId: '' });

  // Rehearsal modal state (for post-habit-creation landing flow)
  const [rehearsalHabit, setRehearsalHabit] = useState<{ anchor: string; tiny_behavior: string; celebration_method: string } | null>(null);

  const { habits, addHabit, deleteHabit, checkInHabit, updateHabit, evolveHabit, aspirations, addAspiration, pauseHabit, getWeeklyCompletionRate, recordFailure, setHabitChain, isLoading } = useHabits();

  // Initialize notification system (checks every minute for backup_time reminders)
  const { permissionGranted, requestPermission } = useNotifications(habits);

  // Initialize StatusBar on app mount (Android-specific)
  useEffect(() => {
    const initStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
      } catch (e) {
        // Ignore on web
      }
    };
    initStatusBar();
  }, []);

  // Request native notification permissions on app mount (Android 13+)
  useEffect(() => {
    const requestNativePermissions = async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.requestPermissions();
        console.log('Native Notification Permission:', result);
      } catch (e) {
        console.warn('Native notification permission request failed:', e);
      }
    };
    requestNativePermissions();
  }, []);

  // Fire confetti celebration
  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981']
    });
  }, []);

  // Check if it's Sunday evening (for weekly review banner)
  const showWeeklyBanner = useMemo(() => {
    if (weeklyBannerDismissed) return false;
    const now = new Date();
    // Show banner on Sunday (day 0) after 6 PM
    return now.getDay() === 0 && now.getHours() >= 18;
  }, [weeklyBannerDismissed]);

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader className="spin" size={48} color="#818cf8" />
          <p style={{ marginTop: 20, color: '#94a3b8' }}>正在连接云端...</p>
        </div>
      </div>
    );
  }

  const handleFail = (id: string) => {
    console.log("Failed habit:", id);
    // Logic handled in Dashboard modal
  };

  const handleCheckIn = async (id: string, behaviorName: string) => {
    const { nextHabitId } = await checkInHabit(id);
    const habit = habits.find(h => h.id === id);
    const celebration = habit?.celebration_method || "给自己一个微笑";

    // 🎉 Shine: Celebration with confetti and toast
    fireConfetti();

    // Check for habit chaining
    if (nextHabitId) {
      const nextHabit = habits.find(h => h.id === nextHabitId);
      if (nextHabit) {
        setToast({
          message: '✅ 打卡成功！',
          subMessage: `下一个: ${nextHabit.tiny_behavior}`,
          emoji: '🔗'
        });
        return;
      }
    }

    setToast({
      message: '✅ 打卡成功！',
      subMessage: `请立即执行庆祝动作："${celebration}"`,
      emoji: '🎉'
    });
  };

  // Handle failure with auto-scaling check
  const handleFailWithScaling = (id: string) => {
    const { shouldScale, failures, scaledSuggestion } = recordFailure(id);
    const habit = habits.find(h => h.id === id);

    if (shouldScale && habit) {
      setScalingModal({
        isOpen: true,
        habitId: id,
        habitName: habit.tiny_behavior,
        failures,
        suggestion: scaledSuggestion
      });
    }
  };

  // Accept scaling suggestion
  const handleScaleAccept = (newBehavior: string) => {
    const habit = habits.find(h => h.id === scalingModal.habitId);
    if (habit) {
      evolveHabit(scalingModal.habitId, habit.anchor, newBehavior, 'downgrade');
      setToast({
        message: '📉 已缩减习惯难度',
        subMessage: `新行为: ${newBehavior}`,
        emoji: '🌱'
      });
    }
    setScalingModal({ isOpen: false, habitId: '', habitName: '', failures: 0 });
  };

  const handleManualSave = (anchor: string, behavior: string, aspiration: string, celebration?: string, backupTime?: string, habitType?: 'regular' | 'pearl') => {
    addHabit(anchor, behavior, undefined, aspiration, celebration || '握拳说"Yes!"', backupTime, habitType || 'regular');

    // Trigger rehearsal modal for landing flow
    setRehearsalHabit({
      anchor,
      tiny_behavior: behavior,
      celebration_method: celebration || '握拳说"Yes!"'
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>福格行为设计助手</h1>
        <button
          className="settings-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="系统设置"
        >
          ⚙️
        </button>
      </header>

      {/* Weekly Review Banner (Sunday Evening) */}
      {showWeeklyBanner && (
        <div className="weekly-banner">
          <div className="banner-content">
            <Calendar size={20} />
            <span>🌿 本周园丁时间到了！来回顾一下成果吧。</span>
          </div>
          <div className="banner-actions">
            <button className="banner-btn primary" onClick={() => { setIsWeeklyReviewOpen(true); setWeeklyBannerDismissed(true); }}>
              开始复盘
            </button>
            <button className="banner-btn dismiss" onClick={() => setWeeklyBannerDismissed(true)}>
              稍后
            </button>
          </div>
        </div>
      )}

      <main className="app-main full-width">
        {/* Heatmap Section */}
        <section className="heatmap-section">
          <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading heatmap...</div>}>
            <Heatmap habits={habits} />
          </Suspense>
        </section>

        {/* Full Screen Dashboard */}
        <section className="dashboard-section">
          <HabitDashboard
            habits={habits.filter(h => !h.paused)}
            onDelete={deleteHabit}
            onCheckIn={(id) => {
              const h = habits.find(i => i.id === id);
              handleCheckIn(id, h?.tiny_behavior || "Habit");
            }}
            onFail={handleFail}
            onUpdate={updateHabit}
            onEvolve={evolveHabit}
            aspirations={aspirations}
            onSetChain={(id) => setChainModal({ isOpen: true, habitId: id })}
          />
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fab-container">
        {isCreatorOpen && (
          <div className="fab-menu">
            <button className="fab-item manual" onClick={() => { setIsManualOpen(true); setIsCreatorOpen(false); }}>
              <Zap size={20} /> 快速添加
            </button>
            <button className="fab-item wizard" onClick={() => { setIsWizardOpen(true); setIsCreatorOpen(false); }}>
              <Sparkles size={20} /> AI 向导
            </button>
          </div>
        )}
        <button
          className={`fab-main ${isCreatorOpen ? 'open' : ''}`}
          onClick={() => setIsCreatorOpen(!isCreatorOpen)}
        >
          {isCreatorOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ManualEntryModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSave={handleManualSave}
        aspirations={aspirations}
        onAddAspiration={addAspiration}
      />

      {/* Wizard Modal Wrapper */}
      {isWizardOpen && (
        <div className="wizard-modal-overlay">
          <div className="wizard-modal-content">
            <button className="wizard-close-btn" onClick={() => setIsWizardOpen(false)}>
              <X size={24} />
            </button>
            <Suspense fallback={
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader className="spin" size={32} color="#818cf8" />
              </div>
            }>
              <BehaviorWizard onSave={(...args) => {
                addHabit(...args);
                setIsWizardOpen(false);
              }} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        onClose={() => setIsWeeklyReviewOpen(false)}
        habits={habits}
        getWeeklyCompletionRate={getWeeklyCompletionRate}
        onPause={pauseHabit}
        onDelete={deleteHabit}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          subMessage={toast.subMessage}
          emoji={toast.emoji}
          onClose={() => setToast(null)}
        />
      )}

      {/* Auto-Scaling Suggestion Modal */}
      <ScalingSuggestionModal
        isOpen={scalingModal.isOpen}
        onClose={() => setScalingModal({ isOpen: false, habitId: '', habitName: '', failures: 0 })}
        habitName={scalingModal.habitName}
        failureCount={scalingModal.failures}
        suggestion={scalingModal.suggestion}
        onAccept={handleScaleAccept}
        onDecline={() => setScalingModal({ isOpen: false, habitId: '', habitName: '', failures: 0 })}
      />

      {/* Chain Setting Modal */}
      {chainModal.habitId && (
        <ChainSettingModal
          isOpen={chainModal.isOpen}
          onClose={() => setChainModal({ isOpen: false, habitId: '' })}
          currentHabit={habits.find(h => h.id === chainModal.habitId)!}
          allHabits={habits}
          onSetChain={setHabitChain}
          onAddHabit={async (anchor: string, behavior: string, aspiration?: string) => {
            const newId = await addHabit(anchor, behavior, undefined, aspiration, '握拳说"Yes!"', undefined, 'regular');
            return newId;
          }}
        />
      )}

      {/* Rehearsal Modal - Post-habit-creation landing flow */}
      {rehearsalHabit && (
        <RehearsalModal
          isOpen={true}
          onClose={() => setRehearsalHabit(null)}
          habit={rehearsalHabit}
          onComplete={() => {
            setToast({
              message: '🌱 太棒了！第一步已迈出',
              subMessage: '明天见到锚点时，大脑会自动提醒你',
              emoji: '🚀'
            });
          }}
        />
      )}

    </div>
  )
}

export default App
