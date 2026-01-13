import React, { useState, useMemo } from 'react';
import { X, Trophy, Trash2, Pause, ArrowRight } from 'lucide-react';
import { type HabitRecipe } from '../hooks/useHabits';
import './WeeklyReviewModal.css';

interface WeeklyReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    habits: HabitRecipe[];
    getWeeklyCompletionRate: (habit: HabitRecipe) => number;
    onPause: (id: string, paused: boolean) => void;
    onDelete: (id: string) => void;
}

const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
    isOpen,
    onClose,
    habits,
    getWeeklyCompletionRate,
    onPause,
    onDelete
}) => {
    const [step, setStep] = useState<'highlights' | 'prune'>('highlights');

    // Calculate weekly stats for all habits
    const habitStats = useMemo(() => {
        return habits
            .filter(h => !h.paused) // Only active habits
            .map(h => ({
                habit: h,
                rate: getWeeklyCompletionRate(h)
            }))
            .sort((a, b) => b.rate - a.rate);
    }, [habits, getWeeklyCompletionRate]);

    // Top performers (highest completion rate, at least 1 completion)
    const topPerformers = habitStats.filter(s => s.rate > 0).slice(0, 3);

    // Zombies (< 20% completion rate)
    const zombies = habitStats.filter(s => s.rate < 20);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="weekly-review-card">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                {step === 'highlights' && (
                    <div className="step-content">
                        <div className="step-header">
                            <span className="step-badge">🌿 周末园丁时间</span>
                            <h2>本周高光时刻</h2>
                            <p className="subtitle">让我们看看你这周做得最好的习惯！</p>
                        </div>

                        {topPerformers.length > 0 ? (
                            <div className="highlights-list">
                                {topPerformers.map((item, idx) => (
                                    <div key={item.habit.id} className={`highlight-item rank-${idx + 1}`}>
                                        <div className="rank-badge">
                                            {idx === 0 ? '🏆' : idx === 1 ? '🥈' : '🥉'}
                                        </div>
                                        <div className="highlight-info">
                                            <span className="highlight-behavior">{item.habit.tiny_behavior}</span>
                                            <span className="highlight-rate">{item.rate}% 完成率</span>
                                        </div>
                                        {idx === 0 && <div className="champion-glow"></div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-highlights">
                                <p>这周还没有打卡记录，下周加油！</p>
                            </div>
                        )}

                        <div className="action-footer">
                            <button className="primary-btn" onClick={() => setStep('prune')}>
                                下一步：断舍离 <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'prune' && (
                    <div className="step-content">
                        <div className="step-header">
                            <span className="step-badge">✂️ 断舍离</span>
                            <h2>清理僵尸习惯</h2>
                            <p className="subtitle">放弃不适合的习惯不是失败，是智慧。</p>
                        </div>

                        {zombies.length > 0 ? (
                            <div className="zombies-list">
                                {zombies.map(item => (
                                    <div key={item.habit.id} className="zombie-item">
                                        <div className="zombie-info">
                                            <span className="zombie-behavior">{item.habit.tiny_behavior}</span>
                                            <span className="zombie-rate">{item.rate}% 完成率</span>
                                        </div>
                                        <div className="zombie-actions">
                                            <button
                                                className="action-btn pause"
                                                onClick={() => {
                                                    onPause(item.habit.id, true);
                                                    // Remove from local display
                                                }}
                                                title="暂停"
                                            >
                                                <Pause size={16} /> 暂停
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => {
                                                    if (confirm(`确定要删除 "${item.habit.tiny_behavior}" 吗？`)) {
                                                        onDelete(item.habit.id);
                                                    }
                                                }}
                                                title="删除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-zombies">
                                <span className="congrats-icon">🎉</span>
                                <p>太棒了！没有僵尸习惯需要清理。</p>
                            </div>
                        )}

                        <div className="action-footer">
                            <button className="secondary-btn" onClick={() => setStep('highlights')}>
                                返回
                            </button>
                            <button className="primary-btn" onClick={onClose}>
                                完成复盘
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyReviewModal;
