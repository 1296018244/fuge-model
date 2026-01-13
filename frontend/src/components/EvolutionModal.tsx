import React, { useState, useEffect } from 'react';
import './ManualEntryModal.css'; // Reuse styles
import { ArrowUpCircle, Sparkles } from 'lucide-react';

interface EvolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAnchor: string;
    currentBehavior: string;
    currentLevel: number;
    onSave: (newAnchor: string, newBehavior: string) => void;
}

const EvolutionModal: React.FC<EvolutionModalProps> = ({
    isOpen, onClose, currentAnchor, currentBehavior, currentLevel, onSave
}) => {
    const [anchor, setAnchor] = useState(currentAnchor);
    const [behavior, setBehavior] = useState(currentBehavior);

    useEffect(() => {
        if (isOpen) {
            setAnchor(currentAnchor);
            setBehavior(currentBehavior);
        }
    }, [isOpen, currentAnchor, currentBehavior]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="manual-modal">
                <div className="modal-header">
                    <div className="modal-icon-wrapper upgrade">
                        <ArrowUpCircle size={24} color="#10b981" />
                    </div>
                    <h3>习惯进化 (Level {currentLevel} <span style={{ color: '#10b981' }}>➜ {currentLevel + 1}</span>)</h3>
                </div>

                <div className="modal-body">
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        恭喜你的坚持！是时候增加一点点难度了。
                        <br />
                        <span style={{ opacity: 0.7 }}>例如："做2个俯卧撑" ➜ "做5个俯卧撑"</span>
                    </p>

                    <div className="input-group">
                        <label>⚓️ 锚点 (保持或微调)</label>
                        <input
                            value={anchor}
                            onChange={(e) => setAnchor(e.target.value)}
                            placeholder="Checking current anchor..."
                        />
                    </div>

                    <div className="input-group">
                        <label>🚀 新行为 (稍微难一点点)</label>
                        <input
                            value={behavior}
                            onChange={(e) => setBehavior(e.target.value)}
                            placeholder="E.g. Do 5 pushups"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>取消</button>
                    <button
                        className="save-btn"
                        onClick={() => {
                            if (anchor && behavior) {
                                onSave(anchor, behavior);
                                onClose();
                            }
                        }}
                    >
                        进化 Upgrade!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EvolutionModal;
