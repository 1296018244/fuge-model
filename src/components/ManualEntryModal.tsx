import React, { useState } from 'react';
import { Save, Zap } from 'lucide-react';
import CelebrationDesigner, { celebrationToText } from './CelebrationDesigner';
import type { CelebrationConfig } from './CelebrationDesigner';
import AnchorValidator from './AnchorValidator';
import './AnchorValidator.css';
import './CelebrationDesigner.css';
import './ManualEntryModal.css';

interface ManualEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (anchor: string, behavior: string, aspiration: string, celebration: string, backupTime?: string, habitType?: 'regular' | 'pearl') => void;
    aspirations: string[];
    onAddAspiration: (name: string) => void;
    initialAnchor?: string;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onSave, aspirations, onAddAspiration, initialAnchor }) => {
    const [habitMode, setHabitMode] = useState<'regular' | 'pearl'>('regular');
    const [anchor, setAnchor] = useState(initialAnchor || '');
    const [behavior, setBehavior] = useState('');
    const [celebration, setCelebration] = useState<CelebrationConfig>({
        bodyAction: 'fist',
        selfTalk: 'yes',
        emoji: '🎉'
    });
    const [backupTime, setBackupTime] = useState('');
    const [aspiration, setAspiration] = useState('');
    const [isCreatingAsp, setIsCreatingAsp] = useState(false);
    const [newAspName, setNewAspName] = useState('');

    const handleSubmit = () => {
        if (!anchor || !behavior) return;
        const finalAsp = isCreatingAsp ? newAspName : aspiration;
        if (isCreatingAsp && newAspName) {
            onAddAspiration(newAspName);
        }
        // Convert CelebrationConfig to string for storage
        const celebrationText = celebrationToText(celebration);
        onSave(anchor, behavior, finalAsp || "未分类", celebrationText, backupTime, habitMode);
        onClose();
    };

    // Update anchor when initialAnchor changes or modal re-opens
    React.useEffect(() => {
        if (isOpen) {
            setAnchor(initialAnchor || '');
        }
    }, [isOpen, initialAnchor]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="manual-modal">
                <div className="modal-header">
                    <div className="modal-icon-wrapper">
                        {habitMode === 'pearl' ? '🤪' : <Zap size={24} color="#f59e0b" />}
                    </div>
                    <h3>{habitMode === 'pearl' ? '🧲 珍珠习惯 (化烦恼为力量)' : '快速设计微习惯 (Recipe)'}</h3>
                </div>

                {/* Mode Toggle Tabs */}
                <div className="mode-tabs">
                    <button
                        className={`mode-tab ${habitMode === 'regular' ? 'active' : ''}`}
                        onClick={() => setHabitMode('regular')}
                    >
                        ⚡ 常规模式
                    </button>
                    <button
                        className={`mode-tab ${habitMode === 'pearl' ? 'active' : ''}`}
                        onClick={() => setHabitMode('pearl')}
                    >
                        🤪 珍珠模式
                    </button>
                </div>

                {habitMode === 'pearl' && (
                    <div className="pearl-hint">
                        把生活中的烦恼变成触发器，用积极行为化负面为力量。
                    </div>
                )}

                <div className="modal-body">
                    {/* Vision Selection */}
                    <div className="input-group">
                        <label>🌟 归属于哪个愿景? (Vision Bucket)</label>
                        {!isCreatingAsp ? (
                            <select
                                value={aspiration}
                                onChange={(e) => {
                                    if (e.target.value === '__new__') setIsCreatingAsp(true);
                                    else setAspiration(e.target.value);
                                }}
                            >
                                <option value="" disabled>选择愿景...</option>
                                {aspirations.map(asp => (
                                    <option key={asp} value={asp}>{asp}</option>
                                ))}
                                <option value="__new__">+ 新建愿景...</option>
                            </select>
                        ) : (
                            <div className="new-asp-row">
                                <input
                                    className="asp-input"
                                    placeholder="输入新愿景名称 (如: 深度工作)"
                                    value={newAspName}
                                    onChange={(e) => setNewAspName(e.target.value)}
                                    autoFocus
                                />
                                <button className="save-btn small" onClick={() => {
                                    if (newAspName) {
                                        onAddAspiration(newAspName);
                                        setAspiration(newAspName);
                                        setIsCreatingAsp(false);
                                    }
                                }}>确定</button>
                            </div>
                        )}
                    </div>

                    <div className="recipe-row">
                        <div className="input-group">
                            <label>{habitMode === 'pearl' ? '😤 烦恼时刻 (Irritation)' : '⚓️ 锚点时刻 (Anchor)'}</label>
                            <AnchorValidator
                                anchor={anchor}
                                onChange={setAnchor}
                            />
                        </div>
                        <div className="arrow">➜</div>
                        <div className="input-group">
                            <label>{habitMode === 'pearl' ? '💎 安抚行为' : '🎈 微行为'}</label>
                            <input
                                placeholder={habitMode === 'pearl' ? '例如: 戴上降噪耳机深呼吸 / 倒一杯水平复心情' : '例如: 喝一杯水 / 做2个俯卧撑'}
                                value={behavior}
                                onChange={(e) => setBehavior(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label>⏰ 兜底时间 (Backup Prompt)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="time"
                                value={backupTime}
                                onChange={(e) => setBackupTime(e.target.value)}
                                style={{ width: '150px' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                如果到这时还没做，我会提醒你。
                            </span>
                        </div>
                    </div>

                    {/* Celebration Designer */}
                    <CelebrationDesigner
                        value={celebration}
                        onChange={setCelebration}
                    />
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>取消</button>
                    <button
                        className="save-btn"
                        onClick={handleSubmit}
                        disabled={!anchor.trim() || !behavior.trim()}
                    >
                        <Save size={16} /> 保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualEntryModal;
