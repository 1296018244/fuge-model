import React from 'react';
import './AchievementBadge.css';

export interface Achievement {
    id: string;
    name: string;
    emoji: string;
    description: string;
    unlockedAt?: string;
}

// 成就定义
export const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_check', name: '萌芽', emoji: '🌱', description: '首次打卡' },
    { id: 'streak_7', name: '7天火焰', emoji: '🔥', description: '连续打卡7天' },
    { id: 'streak_30', name: '30天钻石', emoji: '💎', description: '连续打卡30天' },
    { id: 'total_100', name: '百次达人', emoji: '🏆', description: '累计打卡100次' },
    { id: 'habit_chain', name: '链式反应', emoji: '🔗', description: '创建习惯链' },
    { id: 'evolve_up', name: '进化者', emoji: '📈', description: '习惯升级' },
];

// 检查是否解锁成就
export const checkAchievements = (
    habits: any[],
    existingAchievements: string[]
): Achievement[] => {
    const newAchievements: Achievement[] = [];
    const now = new Date().toISOString();

    // 首次打卡
    const totalCompletions = habits.reduce((sum, h) => sum + (h.completed_count || 0), 0);
    if (totalCompletions >= 1 && !existingAchievements.includes('first_check')) {
        newAchievements.push({ ...ACHIEVEMENTS[0], unlockedAt: now });
    }

    // 7天连续
    const maxStreak = Math.max(...habits.map(h => h.current_streak || 0), 0);
    if (maxStreak >= 7 && !existingAchievements.includes('streak_7')) {
        newAchievements.push({ ...ACHIEVEMENTS[1], unlockedAt: now });
    }

    // 30天连续
    if (maxStreak >= 30 && !existingAchievements.includes('streak_30')) {
        newAchievements.push({ ...ACHIEVEMENTS[2], unlockedAt: now });
    }

    // 100次累计
    if (totalCompletions >= 100 && !existingAchievements.includes('total_100')) {
        newAchievements.push({ ...ACHIEVEMENTS[3], unlockedAt: now });
    }

    // 习惯链
    const hasChain = habits.some(h => h.next_habit_id);
    if (hasChain && !existingAchievements.includes('habit_chain')) {
        newAchievements.push({ ...ACHIEVEMENTS[4], unlockedAt: now });
    }

    // 进化（难度升级）
    const hasEvolved = habits.some(h => (h.difficulty_level || 1) > 1);
    if (hasEvolved && !existingAchievements.includes('evolve_up')) {
        newAchievements.push({ ...ACHIEVEMENTS[5], unlockedAt: now });
    }

    return newAchievements;
};

interface AchievementBadgeProps {
    achievements: Achievement[];
    compact?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievements, compact = false }) => {
    if (achievements.length === 0) return null;

    if (compact) {
        return (
            <div className="achievement-compact">
                {achievements.map(a => (
                    <span key={a.id} className="badge-mini" title={`${a.name}: ${a.description}`}>
                        {a.emoji}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="achievement-list">
            {achievements.map(a => (
                <div key={a.id} className="achievement-card">
                    <span className="achievement-emoji">{a.emoji}</span>
                    <div className="achievement-info">
                        <span className="achievement-name">{a.name}</span>
                        <span className="achievement-desc">{a.description}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AchievementBadge;
