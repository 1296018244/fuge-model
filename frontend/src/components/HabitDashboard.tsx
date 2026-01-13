import React, { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Edit2, Save, Zap, Activity, Check, TrendingUp, ChevronDown, ChevronUp, ClipboardList, Link2, Layers } from 'lucide-react';
import type { HabitRecipe } from '../types';
import { getIdentityBadge } from '../utils/identityUtils';
import DiagnosisModal from './DiagnosisModal';
import EvolutionModal from './EvolutionModal';
import HabitClusterView from './HabitClusterView';
import ConfirmModal from './ConfirmModal';
import './ConfirmModal.css';
import './HabitClusterView.css';
import './HabitDashboard.css';

interface DashboardProps {
    habits: HabitRecipe[];
    aspirations?: string[];
    onDelete: (id: string) => void;
    onCheckIn: (id: string) => void;
    onFail: (id: string) => void;
    onUpdate: (id: string, updates: Partial<HabitRecipe>) => void;
    onEvolve: (id: string, newAnchor: string, newBehavior: string) => void;
    onSetChain?: (id: string) => void; // Habit chaining
}

const HabitDashboard: React.FC<DashboardProps> = ({ habits, aspirations, onDelete, onCheckIn, onFail, onUpdate, onEvolve, onSetChain }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ anchor: string; tiny_behavior: string }>({ anchor: '', tiny_behavior: '' });
    const [viewMode, setViewMode] = useState<'grid' | 'vision' | 'cluster'>('vision');

    // Diagnosis State
    const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);
    const [failedHabit, setFailedHabit] = useState<HabitRecipe | null>(null);

    // Evolution State
    const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);

    // Environment Checklist Expansion State
    const [expandedEnvId, setExpandedEnvId] = useState<string | null>(null);
    const [evolvingHabit, setEvolvingHabit] = useState<HabitRecipe | null>(null);

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; habitId: string; habitName: string }>({ isOpen: false, habitId: '', habitName: '' });

    // Display cleaner for legacy data
    const cleanLegacyText = (text: string) => {
        if (!text) return "";
        return text
            .replace(/After I|I will|当|我就/gi, "")
            .replace(/\(.*\)/g, "")
            .replace(/（.*）/g, "")
            .trim();
    };

    if (habits.length === 0) return (
        <div className="dashboard-container empty">
            <h2 className="dashboard-title">全屏看板</h2>
            <div className="empty-state">
                <p>🌱 空空如也，请在左侧添加你的第一个微习惯吧！</p>
            </div>
        </div>
    );

    const startEdit = (habit: HabitRecipe) => {
        setEditingId(habit.id);
        const cleanAnchor = cleanLegacyText(habit.anchor);
        const cleanBehavior = cleanLegacyText(habit.tiny_behavior);
        setEditForm({ anchor: cleanAnchor, tiny_behavior: cleanBehavior });
    };

    const saveEdit = (id: string) => {
        onUpdate(id, editForm);
        setEditingId(null);
    };

    // Handle Fail Click - Open Modal
    const handleFailClick = (habit: HabitRecipe) => {
        setFailedHabit(habit);
        setIsDiagnosisOpen(true);
    };

    // Handle Evolution Click
    const handleEvolveClick = (habit: HabitRecipe) => {
        setEvolvingHabit(habit);
        setIsEvolutionOpen(true);
    };

    const confirmEvolution = (newAnchor: string, newBehavior: string) => {
        if (evolvingHabit) {
            onEvolve(evolvingHabit.id, newAnchor, newBehavior);
            setIsEvolutionOpen(false);
            setEvolvingHabit(null);
        }
    };

    // Handle AI Fix
    const handleApplyFix = (habitId: string, updates: any) => {
        onUpdate(habitId, updates);
    };

    const renderHabitCard = (habit: HabitRecipe) => {
        const isEditing = editingId === habit.id;

        if (isEditing) {
            return (
                <div key={habit.id} className="habit-card editing">
                    <div className="edit-form">
                        <div className="input-group">
                            <label><Activity size={16} /> 触发时刻</label>
                            <input
                                value={editForm.anchor}
                                onChange={(e) => setEditForm({ ...editForm, anchor: e.target.value })}
                                placeholder="例如: 当我..."
                            />
                        </div>
                        <div className="input-group">
                            <label><Zap size={16} /> 微行为</label>
                            <input
                                value={editForm.tiny_behavior}
                                onChange={(e) => setEditForm({ ...editForm, tiny_behavior: e.target.value })}
                                placeholder="例如: 我就..."
                            />
                        </div>
                        <div className="card-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="status-btn fail" onClick={() => setEditingId(null)}><XCircle size={20} /></button>
                            <button className="status-btn success" onClick={() => saveEdit(habit.id)}><Save size={18} /> 保存</button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={habit.id} className={`habit-card ${habit.habit_type === 'pearl' ? 'pearl' : ''}`}>
                {/* Top Bar: Aspiration & Actions */}
                <div className="card-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {habit.habit_type === 'pearl' && <span title="珍珠习惯">🧪</span>}
                        {habit.next_habit_id && (
                            <span
                                className="chain-indicator"
                                title={`链接到: ${habits.find(h => h.id === habit.next_habit_id)?.tiny_behavior || '未知'}`}
                            >
                                <Link2 size={14} />
                            </span>
                        )}
                        <span className="habit-meta-tag">{habit.aspiration || "通用"}</span>
                    </div>
                    <div className="card-actions">
                        <button
                            onClick={() => startEdit(habit)}
                            title="编辑"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => handleEvolveClick(habit)}
                            title="进化"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        >
                            <TrendingUp size={16} />
                        </button>
                        {onSetChain && (
                            <button
                                onClick={() => onSetChain(habit.id)}
                                title="设置习惯链"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: habit.next_habit_id ? '#818cf8' : '#64748b' }}
                            >
                                <Link2 size={16} />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({
                                    isOpen: true,
                                    habitId: habit.id,
                                    habitName: habit.tiny_behavior
                                });
                            }}
                            title="删除"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Content: ABC Flow */}
                <div className="behavior-flow">
                    {/* Anchor */}
                    <div className="flow-item trigger">
                        <div className="flow-icon"><Activity size={18} /></div>
                        <div className="flow-text">
                            <span className="flow-label">触发</span>
                            <p className="flow-content">{cleanLegacyText(habit.anchor)}</p>
                        </div>
                    </div>

                    {/* Connector */}
                    <div className="flow-connector">
                        <div className="line"></div>
                    </div>

                    {/* Behavior */}
                    <div className="flow-item action">
                        <div className="flow-icon"><Zap size={18} /></div>
                        <div className="flow-text">
                            <span className="flow-label">行为</span>
                            <p className="flow-content">{cleanLegacyText(habit.tiny_behavior)}</p>
                        </div>
                    </div>
                </div>

                {/* Environment Checklist (Collapsible) */}
                {habit.environment_setup && habit.environment_setup.ready_checklist && habit.environment_setup.ready_checklist.length > 0 && (
                    <div className="env-checklist-panel">
                        <button
                            className="env-toggle-btn"
                            onClick={() => setExpandedEnvId(expandedEnvId === habit.id ? null : habit.id)}
                        >
                            <ClipboardList size={16} />
                            <span>环境清单 ({habit.environment_setup.ready_checklist.length})</span>
                            {expandedEnvId === habit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {expandedEnvId === habit.id && (
                            <ul className="env-checklist-items">
                                {habit.environment_setup.ready_checklist.map((item: string, idx: number) => (
                                    <li key={idx}>
                                        <Check size={14} className="check-icon" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Footer: Stats & Actions */}
                <div className="card-footer">
                    <div className="stats-section">
                        <div className="stats-badge">
                            连续: <span className="count">{habit.current_streak || 0}</span>
                        </div>
                        {/* Identity Badge (Feature 3) */}
                        {(() => {
                            const badge = getIdentityBadge(habit.tiny_behavior, habit.completed_count || 0);
                            if (badge) {
                                return (
                                    <div className={`identity-badge badge-lvl-${badge.level}`} title={`${badge.levelName}: ${habit.completed_count} 次完成`}>
                                        <span className="badge-emoji">{badge.emoji}</span>
                                        <span className="badge-name">{badge.name}</span>
                                        <span className="badge-level">等级{badge.level}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="footer-actions">
                        <button className="status-btn fail" onClick={() => handleFailClick(habit)} title="遇到困难?">
                            <XCircle size={20} />
                        </button>
                        <button className="status-btn success" onClick={() => onCheckIn(habit.id)}>
                            <CheckCircle size={18} /> 打卡
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">习惯看板</h2>
                <span className="habit-count">共 {habits.length} 个习惯</span>
            </div>

            {/* View Toggle */}
            <div className="view-toggle" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setViewMode('grid')}
                    style={{
                        background: viewMode === 'grid' ? '#6366f1' : 'transparent',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    查看: 全部
                </button>
                <button
                    onClick={() => setViewMode('vision')}
                    style={{
                        background: viewMode === 'vision' ? '#6366f1' : 'transparent',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    查看: 按愿景
                </button>
                <button
                    onClick={() => setViewMode('cluster')}
                    style={{
                        background: viewMode === 'cluster' ? '#10b981' : 'transparent',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                    }}
                >
                    <Layers size={16} /> 群落视图
                </button>
            </div>

            {habits.length === 0 ? (
                <div className="empty-state">
                    <Sparkles size={48} />
                    <h3>这里还很空旷</h3>
                    <p>点击右下角的 + 开始设计第一个微习惯吧</p>
                </div>
            ) : (
                <>
                    {viewMode === 'cluster' ? (
                        <HabitClusterView habits={habits} />
                    ) : viewMode === 'grid' ? (
                        <div className="habits-grid">
                            {habits.map(renderHabitCard)}
                        </div>
                    ) : (
                        <div className="habits-vision-groups" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* 1. Predefined Aspirations */}
                            {(aspirations || ["未分类"]).map(asp => {
                                const groupHabits = habits.filter(h => (h.aspiration || "未分类") === asp);
                                if (groupHabits.length === 0) return null;
                                return (
                                    <div key={asp} className="vision-group">
                                        <h3 style={{ color: '#94a3b8', borderLeft: '4px solid #6366f1', paddingLeft: '1rem', marginBottom: '1rem' }}>
                                            {asp}
                                            <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', opacity: 0.6 }}>({groupHabits.length})</span>
                                        </h3>
                                        <div className="habits-grid">
                                            {groupHabits.map(renderHabitCard)}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 2. Dynamic Aspirations (IIFE) */}
                            {(() => {
                                const known = new Set(aspirations || []);
                                const others = habits.filter(h => !known.has(h.aspiration || "未分类"));
                                if (others.length > 0) {
                                    const dynamics: Record<string, HabitRecipe[]> = {};
                                    others.forEach(h => {
                                        const key = h.aspiration || "未分类";
                                        if (!dynamics[key]) dynamics[key] = [];
                                        dynamics[key].push(h);
                                    });

                                    return Object.keys(dynamics).map(asp => (
                                        <div key={asp} className="vision-group">
                                            <h3 style={{ color: '#94a3b8', borderLeft: '4px solid #10b981', paddingLeft: '1rem', marginBottom: '1rem' }}>
                                                {asp} <span style={{ fontSize: '0.8rem' }}>(动态)</span>
                                            </h3>
                                            <div className="habits-grid">
                                                {dynamics[asp].map(renderHabitCard)}
                                            </div>
                                        </div>
                                    ));
                                }
                                return null;
                            })()}
                        </div>
                    )}
                </>
            )}

            <DiagnosisModal
                isOpen={isDiagnosisOpen}
                onClose={() => setIsDiagnosisOpen(false)}
                habit={failedHabit}
                onApplyFix={handleApplyFix}
            />

            <EvolutionModal
                isOpen={isEvolutionOpen}
                onClose={() => setIsEvolutionOpen(false)}
                currentAnchor={evolvingHabit?.anchor || ''}
                currentBehavior={evolvingHabit?.tiny_behavior || ''}
                currentLevel={evolvingHabit?.difficulty_level || 1}
                onSave={confirmEvolution}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="删除习惯"
                message={`确定要删除「${deleteConfirm.habitName}」吗？云端数据也将同步删除。`}
                confirmText="删除"
                cancelText="取消"
                variant="danger"
                onConfirm={() => {
                    onDelete(deleteConfirm.habitId);
                    setDeleteConfirm({ isOpen: false, habitId: '', habitName: '' });
                }}
                onCancel={() => setDeleteConfirm({ isOpen: false, habitId: '', habitName: '' })}
            />
        </div>
    );
};

export default HabitDashboard;
