import React, { useState } from 'react';
import { CheckCircle, Circle, X, Sparkles } from 'lucide-react';
import './EnvironmentCheckModal.css';

interface EnvironmentCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    habitName: string;
    checklist: string[];
}

const EnvironmentCheckModal: React.FC<EnvironmentCheckModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    habitName,
    checklist
}) => {
    const [checked, setChecked] = useState<boolean[]>(checklist.map(() => false));

    if (!isOpen || checklist.length === 0) return null;

    const allChecked = checked.every(c => c);

    const toggleItem = (index: number) => {
        const newChecked = [...checked];
        newChecked[index] = !newChecked[index];
        setChecked(newChecked);
    };

    const handleConfirm = () => {
        setChecked(checklist.map(() => false)); // Reset for next time
        onConfirm();
    };

    return (
        <div className="modal-overlay">
            <div className="env-check-card">
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                <div className="env-check-header">
                    <Sparkles size={24} className="icon" />
                    <h2>环境准备检查</h2>
                </div>

                <p className="env-check-subtitle">
                    在执行「{habitName}」之前，确认环境已准备好：
                </p>

                <div className="env-checklist">
                    {checklist.map((item, idx) => (
                        <button
                            key={idx}
                            className={`checklist-item ${checked[idx] ? 'checked' : ''}`}
                            onClick={() => toggleItem(idx)}
                        >
                            {checked[idx] ? (
                                <CheckCircle size={20} className="check-icon" />
                            ) : (
                                <Circle size={20} className="check-icon" />
                            )}
                            <span>{item}</span>
                        </button>
                    ))}
                </div>

                <div className="env-check-footer">
                    <button className="skip-btn" onClick={onClose}>
                        跳过
                    </button>
                    <button
                        className={`confirm-btn ${allChecked ? 'ready' : ''}`}
                        onClick={handleConfirm}
                        disabled={!allChecked}
                    >
                        {allChecked ? '✓ 开始执行' : '请完成检查'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentCheckModal;
