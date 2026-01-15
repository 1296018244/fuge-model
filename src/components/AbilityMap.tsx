import React from 'react';
import { BarChart3 } from 'lucide-react';
import './AbilityMap.css';

interface AbilityMapProps {
    habits: Array<{
        id: string;
        tiny_behavior: string;
        difficulty_level?: number;
        completed_count?: number;
    }>;
}

const AbilityMap: React.FC<AbilityMapProps> = ({ habits }) => {
    if (habits.length === 0) return null;

    // 按难度分组
    const levels: Record<number, typeof habits> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    habits.forEach(h => {
        const level = Math.min(5, Math.max(1, h.difficulty_level || 1));
        levels[level].push(h);
    });

    const levelLabels = ['极简', '简单', '中等', '挑战', '困难'];
    const levelColors = ['#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444'];

    return (
        <div className="ability-map">
            <div className="ability-map-header">
                <BarChart3 size={18} />
                <span>能力地图</span>
            </div>
            <div className="ability-levels">
                {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className="ability-level">
                        <div className="level-label">
                            <span
                                className="level-dot"
                                style={{ background: levelColors[level - 1] }}
                            />
                            <span className="level-name">{levelLabels[level - 1]}</span>
                            <span className="level-count">{levels[level].length}</span>
                        </div>
                        <div className="level-bar-container">
                            <div
                                className="level-bar"
                                style={{
                                    width: `${(levels[level].length / habits.length) * 100}%`,
                                    background: levelColors[level - 1]
                                }}
                            />
                        </div>
                        {levels[level].length > 0 && (
                            <div className="level-habits">
                                {levels[level].slice(0, 3).map(h => (
                                    <span key={h.id} className="habit-chip">
                                        {h.tiny_behavior.slice(0, 8)}
                                        {h.tiny_behavior.length > 8 ? '...' : ''}
                                    </span>
                                ))}
                                {levels[level].length > 3 && (
                                    <span className="more-chip">+{levels[level].length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <p className="ability-tip">
                💡 福格建议：保持大部分习惯在"极简"到"简单"区间
            </p>
        </div>
    );
};

export default AbilityMap;
