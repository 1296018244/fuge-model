import React from 'react';
import { AlertTriangle, ArrowDown, X, Check } from 'lucide-react';
import './ScalingSuggestionModal.css';

interface ScalingSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    habitName: string;
    failureCount: number;
    suggestion?: string;
    onAccept: (newBehavior: string) => void;
    onDecline: () => void;
}

const ScalingSuggestionModal: React.FC<ScalingSuggestionModalProps> = ({
    isOpen,
    onClose,
    habitName,
    failureCount,
    suggestion,
    onAccept,
    onDecline,
}) => {
    if (!isOpen) return null;

    // 自动生成更简单版本的建议
    const generateSimpleSuggestion = (behavior: string): string => {
        // 如果行为包含数字，减半
        const numberMatch = behavior.match(/(\d+)/);
        if (numberMatch) {
            const num = parseInt(numberMatch[1]);
            const reduced = Math.max(1, Math.floor(num / 2));
            return behavior.replace(numberMatch[1], reduced.toString());
        }
        // 否则添加"只做1次"
        return `只做1次: ${behavior}`;
    };

    const simpleSuggestion = suggestion || generateSimpleSuggestion(habitName);

    return (
        <div className="modal-overlay scaling-modal">
            <div className="modal-content scaling-content">
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="scaling-header">
                    <AlertTriangle size={48} className="warning-icon" />
                    <h2>连续 {failureCount} 次未完成</h2>
                </div>

                <div className="scaling-body">
                    <p className="current-behavior">
                        当前行为：<strong>{habitName}</strong>
                    </p>

                    <div className="arrow-section">
                        <ArrowDown size={32} />
                        <span>福格建议：缩减难度</span>
                    </div>

                    <div className="suggested-behavior">
                        <span className="label">建议调整为：</span>
                        <p className="new-behavior">{simpleSuggestion}</p>
                    </div>

                    <blockquote className="fogg-quote">
                        "当行为太难时，缩减它。<br />
                        成功的秘诀是让行为小到做不到都难。"
                        <footer>— BJ Fogg</footer>
                    </blockquote>
                </div>

                <div className="scaling-actions">
                    <button className="action-btn decline" onClick={onDecline}>
                        <X size={18} /> 暂时保持
                    </button>
                    <button className="action-btn accept" onClick={() => onAccept(simpleSuggestion)}>
                        <Check size={18} /> 接受调整
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScalingSuggestionModal;
