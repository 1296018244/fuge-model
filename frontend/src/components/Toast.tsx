import React, { useEffect, useState } from 'react';
import './Toast.css';

interface ToastProps {
    message: string;
    subMessage?: string;
    emoji?: string;
    duration?: number;
    onClose: () => void;
    celebrationAction?: string; // 庆祝动作指令
    showConfetti?: boolean; // 是否显示粒子动画
}

const Toast: React.FC<ToastProps> = ({
    message,
    subMessage,
    emoji = '🎉',
    duration = 4000,
    onClose,
    celebrationAction,
    showConfetti = false
}) => {
    const [isVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

    // 生成庆祝粒子
    useEffect(() => {
        if (showConfetti) {
            const celebrationEmojis = ['✨', '🌟', '⭐', '💫', '🎉', '🎊'];
            const newParticles = Array.from({ length: 12 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)]
            }));
            setParticles(newParticles);
        }
    }, [showConfetti]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-container ${isLeaving ? 'leaving' : ''} ${showConfetti ? 'celebration' : ''}`}>
            {/* 庆祝粒子 */}
            {showConfetti && (
                <div className="toast-particles">
                    {particles.map(p => (
                        <span
                            key={p.id}
                            className="particle"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                animationDelay: `${p.id * 0.1}s`
                            }}
                        >
                            {p.emoji}
                        </span>
                    ))}
                </div>
            )}

            <div className="toast-card">
                <span className="toast-emoji">{emoji}</span>
                <div className="toast-content">
                    <p className="toast-message">{message}</p>
                    {subMessage && <p className="toast-sub">{subMessage}</p>}

                    {/* 庆祝动作提示 */}
                    {celebrationAction && (
                        <div className="celebration-instruction">
                            <span className="instruction-label">🎯 现在，</span>
                            <span className="instruction-action">{celebrationAction}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toast;

