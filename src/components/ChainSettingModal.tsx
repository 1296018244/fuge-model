import React, { useState } from 'react';
import { Link2, X, Check, Unlink, Plus, Activity, Zap } from 'lucide-react';
import type { HabitRecipe } from '../hooks/useHabits';
import './ChainSettingModal.css';

interface ChainSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentHabit: HabitRecipe;
    allHabits: HabitRecipe[];
    onSetChain: (habitId: string, nextHabitId: string | null) => void;
    onAddHabit?: (anchor: string, behavior: string, aspiration?: string) => Promise<string>; // Returns new habit ID
}

const ChainSettingModal: React.FC<ChainSettingModalProps> = ({
    isOpen,
    onClose,
    currentHabit,
    allHabits,
    onSetChain,
    onAddHabit,
}) => {
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
        currentHabit.next_habit_id || null
    );
    const [isCreating, setIsCreating] = useState(false);
    const [newAnchor, setNewAnchor] = useState('');
    const [newBehavior, setNewBehavior] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    // 过滤掉当前习惯，避免自己链接自己
    const availableHabits = allHabits.filter(h => h.id !== currentHabit.id);


    const handleSave = async () => {
        await onSetChain(currentHabit.id, selectedHabitId);
        onClose();
    };

    const handleUnlink = async () => {
        await onSetChain(currentHabit.id, null);
        setSelectedHabitId(null);
        onClose();
    };

    const handleCreateAndLink = async () => {
        if (!newBehavior.trim() || !onAddHabit) return;

        setIsSaving(true);
        try {
            // Auto-set anchor to reference the current habit
            const autoAnchor = `完成「${currentHabit.tiny_behavior}」之后`;

            // Create the new habit with the same aspiration as current habit
            const newHabitId = await onAddHabit(autoAnchor, newBehavior.trim(), currentHabit.aspiration);

            // Link the current habit to the newly created one - AWAIT to ensure persistence
            await onSetChain(currentHabit.id, newHabitId);
            onClose();
        } catch (e) {
            console.error('Failed to create habit:', e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content chain-modal">
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Link2 size={20} /> 设置习惯链
                    </h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="chain-info">
                    <p>完成 <strong>"{currentHabit.tiny_behavior}"</strong> 后，自动提醒执行下一个习惯</p>
                </div>

                {/* Toggle between selecting existing vs creating new */}
                <div className="chain-mode-toggle" style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '1rem'
                }}>
                    <button
                        onClick={() => setIsCreating(false)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: !isCreating ? '#6366f1' : 'transparent',
                            border: '1px solid #6366f1',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        选择已有习惯
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: isCreating ? '#10b981' : 'transparent',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}
                    >
                        <Plus size={16} /> 新建习惯
                    </button>
                </div>

                {isCreating ? (
                    /* Inline habit creation form */
                    <div className="create-habit-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Zap size={16} /> 接下来要做什么？
                            </label>
                            <input
                                value={newBehavior}
                                onChange={(e) => setNewBehavior(e.target.value)}
                                placeholder="例如: 做5个深蹲"
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    background: '#1e293b',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                                autoFocus
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            触发时刻自动设为「完成 {currentHabit.tiny_behavior} 之后」
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            新习惯将自动归类到「{currentHabit.aspiration || '未分类'}」
                        </p>
                    </div>
                ) : (
                    /* Existing habit selection */
                    <div className="habit-list">
                        <label className="list-label">选择下一个习惯：</label>
                        {availableHabits.length === 0 ? (
                            <p className="no-habits">暂无其他可链接的习惯，试试"新建习惯"吧！</p>
                        ) : (
                            <div className="habit-options">
                                {availableHabits.map(habit => (
                                    <button
                                        key={habit.id}
                                        className={`habit-option ${selectedHabitId === habit.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedHabitId(habit.id)}
                                    >
                                        <span className="option-behavior">{habit.tiny_behavior}</span>
                                        <span className="option-anchor">在 {habit.anchor} 之后</span>
                                        {selectedHabitId === habit.id && <Check size={16} className="check-icon" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-footer chain-footer">
                    {currentHabit.next_habit_id && (
                        <button className="unlink-btn" onClick={handleUnlink}>
                            <Unlink size={16} /> 解除链接
                        </button>
                    )}
                    <div className="right-actions">
                        <button className="cancel-btn" onClick={onClose}>取消</button>
                        {isCreating ? (
                            <button
                                className="save-btn"
                                onClick={handleCreateAndLink}
                                disabled={!newBehavior.trim() || isSaving}
                                style={{ background: '#10b981' }}
                            >
                                {isSaving ? '创建中...' : <><Plus size={16} /> 创建并链接</>}
                            </button>
                        ) : (
                            <button
                                className="save-btn"
                                onClick={handleSave}
                                disabled={!selectedHabitId}
                            >
                                <Check size={16} /> 确认链接
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChainSettingModal;

