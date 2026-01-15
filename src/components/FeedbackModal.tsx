import React from 'react';
import { MessageSquare, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import './ConfirmModal.css'; // Reuse styles

interface FeedbackModalProps {
    isOpen: boolean;
    habitName: string;
    onClose: () => void;
    onFeedback: (isHelpful: boolean) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
    isOpen,
    habitName,
    onClose,
    onFeedback
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay">
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={18} />
                </button>

                <div className="confirm-icon" style={{ background: '#6366f120' }}>
                    <span>🤔</span>
                </div>

                <h3 className="confirm-title">AI 建议回访</h3>
                <p className="confirm-message">
                    距离你采用 AI 建议调整「{habitName}」已经过了一段时间。
                    <br /><br />
                    这个新方案对你有帮助吗？
                </p>

                <div className="confirm-actions">
                    <button
                        className="confirm-btn"
                        style={{ background: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                        onClick={() => onFeedback(false)}
                    >
                        <ThumbsDown size={16} /> 没啥用
                    </button>
                    <button
                        className="confirm-btn"
                        style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                        onClick={() => onFeedback(true)}
                    >
                        <ThumbsUp size={16} /> 有帮助
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
