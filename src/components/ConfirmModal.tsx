import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    onConfirm,
    onCancel,
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const variantColors = {
        danger: { bg: '#ef4444', icon: '🗑️' },
        warning: { bg: '#f59e0b', icon: '⚠️' },
        info: { bg: '#6366f1', icon: 'ℹ️' }
    };

    const { bg, icon } = variantColors[variant];

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                <button className="confirm-close" onClick={onCancel}>
                    <X size={18} />
                </button>

                <div className="confirm-icon" style={{ background: `${bg}20` }}>
                    <span>{icon}</span>
                </div>

                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>

                <div className="confirm-actions">
                    <button className="confirm-btn cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className="confirm-btn confirm"
                        style={{ background: bg }}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
