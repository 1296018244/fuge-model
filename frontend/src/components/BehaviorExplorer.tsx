import React, { useState } from 'react';
import { Lightbulb, Target, Zap, Star, ChevronRight, Plus } from 'lucide-react';
import './BehaviorExplorer.css';

interface BehaviorOption {
    id: string;
    behavior: string;
    impact: number;  // 1-5 影响力
    ease: number;    // 1-5 容易程度
}

interface BehaviorExplorerProps {
    aspiration: string;  // 用户的愿景/大目标
    onSelectBehavior: (behavior: string) => void;
    onClose: () => void;
}

// 预设行为库（按愿景分类）
const BEHAVIOR_TEMPLATES: Record<string, BehaviorOption[]> = {
    '健康': [
        { id: '1', behavior: '喝一杯水', impact: 3, ease: 5 },
        { id: '2', behavior: '做5个深蹲', impact: 4, ease: 4 },
        { id: '3', behavior: '伸展30秒', impact: 3, ease: 5 },
        { id: '4', behavior: '吃一个水果', impact: 4, ease: 4 },
        { id: '5', behavior: '走100步', impact: 4, ease: 5 },
    ],
    '学习': [
        { id: '1', behavior: '读一页书', impact: 4, ease: 5 },
        { id: '2', behavior: '听5分钟播客', impact: 3, ease: 5 },
        { id: '3', behavior: '写3行笔记', impact: 4, ease: 4 },
        { id: '4', behavior: '复习一个概念', impact: 4, ease: 4 },
        { id: '5', behavior: '看一个教学视频', impact: 4, ease: 4 },
    ],
    '效率': [
        { id: '1', behavior: '写下今天的第一个任务', impact: 5, ease: 5 },
        { id: '2', behavior: '整理桌面1分钟', impact: 3, ease: 5 },
        { id: '3', behavior: '关掉一个分心的App', impact: 4, ease: 5 },
        { id: '4', behavior: '设置番茄钟', impact: 4, ease: 5 },
        { id: '5', behavior: '处理一封邮件', impact: 3, ease: 4 },
    ],
    'default': [
        { id: '1', behavior: '深呼吸3次', impact: 3, ease: 5 },
        { id: '2', behavior: '写下一件感恩的事', impact: 4, ease: 4 },
        { id: '3', behavior: '整理一个小物件', impact: 2, ease: 5 },
        { id: '4', behavior: '给自己倒杯水', impact: 3, ease: 5 },
        { id: '5', behavior: '站起来伸展', impact: 3, ease: 5 },
    ]
};

const BehaviorExplorer: React.FC<BehaviorExplorerProps> = ({ aspiration, onSelectBehavior, onClose }) => {
    const [behaviors, setBehaviors] = useState<BehaviorOption[]>(() => {
        // 根据愿景匹配模板
        for (const [key, value] of Object.entries(BEHAVIOR_TEMPLATES)) {
            if (aspiration.includes(key)) return value;
        }
        return BEHAVIOR_TEMPLATES.default;
    });
    const [customBehavior, setCustomBehavior] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // 计算行为是否为"黄金行为"（高影响力 + 高易用性）
    const isGolden = (b: BehaviorOption) => b.impact >= 4 && b.ease >= 4;

    // 按象限排序：右上角优先
    const sortedBehaviors = [...behaviors].sort((a, b) => {
        const scoreA = a.impact + a.ease;
        const scoreB = b.impact + b.ease;
        return scoreB - scoreA;
    });

    const handleSelect = (behavior: BehaviorOption) => {
        setSelectedId(behavior.id);
    };

    const handleConfirm = () => {
        const selected = behaviors.find(b => b.id === selectedId);
        if (selected) {
            onSelectBehavior(selected.behavior);
        }
    };

    const handleAddCustom = () => {
        if (!customBehavior.trim()) return;
        const newBehavior: BehaviorOption = {
            id: Date.now().toString(),
            behavior: customBehavior,
            impact: 3,
            ease: 4,
        };
        setBehaviors([...behaviors, newBehavior]);
        setCustomBehavior('');
        setSelectedId(newBehavior.id);
    };

    return (
        <div className="behavior-explorer">
            <div className="explorer-header">
                <Lightbulb size={24} color="#fbbf24" />
                <div>
                    <h3>探索黄金行为 💎</h3>
                    <p>选择高影响力 + 容易做的行为，这就是福格说的"黄金行为"</p>
                </div>
            </div>

            <div className="explorer-aspiration">
                <Target size={16} />
                <span>目标愿景: {aspiration || '未设置'}</span>
            </div>

            {/* 2x2 矩阵说明 */}
            <div className="matrix-legend">
                <div className="legend-item golden">
                    <Star size={14} /> 黄金区 (选这里!)
                </div>
                <div className="legend-item good">
                    高影响力
                </div>
                <div className="legend-item easy">
                    容易做
                </div>
            </div>

            {/* 行为选项列表 */}
            <div className="behavior-list">
                {sortedBehaviors.map(b => (
                    <button
                        key={b.id}
                        className={`behavior-item ${selectedId === b.id ? 'selected' : ''} ${isGolden(b) ? 'golden' : ''}`}
                        onClick={() => handleSelect(b)}
                    >
                        <div className="behavior-main">
                            {isGolden(b) && <span className="golden-badge">💎</span>}
                            <span className="behavior-text">{b.behavior}</span>
                        </div>
                        <div className="behavior-scores">
                            <span className="score impact" title="影响力">
                                <Zap size={12} /> {b.impact}
                            </span>
                            <span className="score ease" title="容易程度">
                                ✨ {b.ease}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* 自定义添加 */}
            <div className="custom-add">
                <input
                    type="text"
                    placeholder="或输入你自己想到的行为..."
                    value={customBehavior}
                    onChange={(e) => setCustomBehavior(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <button onClick={handleAddCustom} disabled={!customBehavior.trim()}>
                    <Plus size={18} />
                </button>
            </div>

            {/* 操作按钮 */}
            <div className="explorer-actions">
                <button className="btn-cancel" onClick={onClose}>
                    取消
                </button>
                <button
                    className="btn-confirm"
                    onClick={handleConfirm}
                    disabled={!selectedId}
                >
                    使用此行为 <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default BehaviorExplorer;
