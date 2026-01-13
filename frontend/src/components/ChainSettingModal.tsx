import React, { useState } from 'react';
import { Link2, X, Check, Unlink, TrendingUp } from 'lucide-react';
import type { HabitRecipe } from '../types';
import './ChainSettingModal.css';

interface ChainSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentHabit: HabitRecipe;
    allHabits: HabitRecipe[];
    onSetChain: (habitId: string, nextHabitId: string | null) => void;
}

const ChainSettingModal: React.FC<ChainSettingModalProps> = ({
    isOpen,
    onClose,
    currentHabit,
    allHabits,
    onSetChain,
}) => {
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
        currentHabit.next_habit_id || null
    );

    if (!isOpen) return null;

    // 过滤掉当前习惯，避免自己链接自己
    const availableHabits = allHabits.filter(h => h.id !== currentHabit.id);

    const handleSave = () => {
        onSetChain(currentHabit.id, selectedHabitId);
        onClose();
    };

    const handleUnlink = () => {
        onSetChain(currentHabit.id, null);
        setSelectedHabitId(null);
        onClose();
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

                <div className="habit-list">
                    <label className="list-label">选择下一个习惯：</label>
                    {availableHabits.length === 0 ? (
                        <p className="no-habits">暂无其他可链接的习惯</p>
                    ) : (
                        <div className="habit-options">
                            {availableHabits.map(habit => (
                                <button
                                    key={habit.id}
                                    className={`habit-option ${selectedHabitId === habit.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedHabitId(habit.id)}
                                >
                                    <div className="option-main">
                                        <span className="option-behavior">{habit.tiny_behavior}</span>
                                        <span className="option-anchor">在 {habit.anchor} 之后</span>
                                    </div>
                                    <div className="option-stats">
                                        <span className="option-count" title="打卡次数">
                                            <TrendingUp size={12} /> {habit.completed_count || 0}
                                        </span>
                                        {selectedHabitId === habit.id && <Check size={16} className="check-icon" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer chain-footer">
                    {currentHabit.next_habit_id && (
                        <button className="unlink-btn" onClick={handleUnlink}>
                            <Unlink size={16} /> 解除链接
                        </button>
                    )}
                    <div className="right-actions">
                        <button className="cancel-btn" onClick={onClose}>取消</button>
                        <button
                            className="save-btn"
                            onClick={handleSave}
                            disabled={!selectedHabitId}
                        >
                            <Check size={16} /> 确认链接
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChainSettingModal;
