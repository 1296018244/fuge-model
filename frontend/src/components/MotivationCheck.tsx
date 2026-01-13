import React, { useState } from 'react';
import { BatteryLow, BatteryMedium, BatteryFull, Zap, ArrowRight } from 'lucide-react';
import './MotivationCheck.css';

interface MotivationCheckProps {
    habitName: string;
    onSelect: (level: 1 | 2 | 3) => void;
    onSkip?: () => void;
    simplifiedVersion?: string; // 低动机时建议的简化版本
}

const MOTIVATION_LEVELS = [
    {
        level: 1 as const,
        emoji: '😫',
        label: '能量很低',
        description: '今天状态不好',
        color: '#ef4444',
        icon: BatteryLow,
    },
    {
        level: 2 as const,
        emoji: '😐',
        label: '一般般',
        description: '还行，能做',
        color: '#f59e0b',
        icon: BatteryMedium,
    },
    {
        level: 3 as const,
        emoji: '💪',
        label: '精力充沛',
        description: '状态很好!',
        color: '#10b981',
        icon: BatteryFull,
    },
];

const MotivationCheck: React.FC<MotivationCheckProps> = ({
    habitName,
    onSelect,
    onSkip,
    simplifiedVersion
}) => {
    const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null);
    const [showSuggestion, setShowSuggestion] = useState(false);

    const handleSelect = (level: 1 | 2 | 3) => {
        setSelectedLevel(level);

        // 如果动机低且有简化版本，显示建议
        if (level === 1 && simplifiedVersion) {
            setShowSuggestion(true);
        } else {
            onSelect(level);
        }
    };

    const handleProceedAnyway = () => {
        if (selectedLevel) onSelect(selectedLevel);
    };

    const handleDoSimplified = () => {
        // 用户选择做简化版本
        if (selectedLevel) onSelect(selectedLevel);
    };

    return (
        <div className="motivation-check">
            <div className="motivation-header">
                <Zap size={18} />
                <span>开始前，你现在的能量状态是？</span>
            </div>

            {!showSuggestion ? (
                <div className="motivation-options">
                    {MOTIVATION_LEVELS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.level}
                                className={`motivation-option ${selectedLevel === item.level ? 'selected' : ''}`}
                                onClick={() => handleSelect(item.level)}
                                style={{
                                    '--option-color': item.color,
                                    '--option-color-alpha': `${item.color}33`
                                } as React.CSSProperties}
                            >
                                <span className="option-emoji">{item.emoji}</span>
                                <div className="option-content">
                                    <span className="option-label">{item.label}</span>
                                    <span className="option-desc">{item.description}</span>
                                </div>
                                <Icon size={20} style={{ color: item.color }} />
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="low-motivation-suggestion">
                    <div className="suggestion-header">
                        <span className="warning-emoji">💡</span>
                        <h4>能量低的时候，做简化版更好！</h4>
                    </div>
                    <p>福格说：低动机时降低难度，保持连续性比完美更重要。</p>

                    <div className="suggestion-comparison">
                        <div className="original">
                            <span className="label">原计划</span>
                            <span className="behavior">{habitName}</span>
                        </div>
                        <ArrowRight size={20} />
                        <div className="simplified">
                            <span className="label">简化版</span>
                            <span className="behavior">{simplifiedVersion}</span>
                        </div>
                    </div>

                    <div className="suggestion-actions">
                        <button className="btn-simplified" onClick={handleDoSimplified}>
                            ✨ 就做简化版
                        </button>
                        <button className="btn-original" onClick={handleProceedAnyway}>
                            坚持原计划
                        </button>
                    </div>
                </div>
            )}

            {onSkip && !showSuggestion && (
                <button className="skip-btn" onClick={onSkip}>
                    跳过，直接打卡
                </button>
            )}
        </div>
    );
};

export default MotivationCheck;
