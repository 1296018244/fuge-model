import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ArrowRight, Eye, FastForward, PartyPopper, Box } from 'lucide-react';
import './SetupModal.css';
import confetti from 'canvas-confetti';

interface SetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    habitData: {
        anchor: string;
        tiny_behavior: string;
        environment_setup?: string[];
    };
    onComplete: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, habitData, onComplete }) => {
    const [step, setStep] = useState<'env' | 'blitz' | 'done'>('env');
    const [checkedItems, setCheckedItems] = useState<number[]>([]);
    const [blitzRep, setBlitzRep] = useState(0);

    if (!isOpen) return null;

    const setupItems = habitData.environment_setup || [
        "把相关物品放在显眼位置",
        "消除可能的干扰源",
        "告诉身边人你的计划"
    ];

    const toggleCheck = (index: number) => {
        if (checkedItems.includes(index)) {
            setCheckedItems(checkedItems.filter(i => i !== index));
        } else {
            setCheckedItems([...checkedItems, index]);
        }
    };

    const startBlitz = () => {
        setStep('blitz');
    };

    const handleBlitzNext = () => {
        if (blitzRep < 2) {
            setBlitzRep(prev => prev + 1);
        } else {
            setStep('done');
        }
    };

    return createPortal(
        <div className="modal-overlay">
            <div className={`setup-card ${step}`}>
                {step === 'env' && (
                    <div className="step-content">
                        <div className="step-header">
                            <span className="step-badge">第一步：环境设计</span>
                            <h2>🧹 为成功铺路</h2>
                            <p className="subtitle">福格教授说：不要靠意志力，要靠环境。</p>
                        </div>

                        <div className="checklist">
                            {setupItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`check-item ${checkedItems.includes(index) ? 'checked' : ''}`}
                                    onClick={() => toggleCheck(index)}
                                >
                                    <div className="checkbox">
                                        {checkedItems.includes(index) && <Check size={16} />}
                                    </div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer">
                            <button className="secondary-btn" onClick={onClose}>稍后再做</button>
                            <button
                                className={`primary-btn ${checkedItems.length === setupItems.length ? '' : 'disabled'}`}
                                disabled={checkedItems.length !== setupItems.length}
                                onClick={startBlitz}
                            >
                                下一步：即时排练 <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'blitz' && (
                    <div className="step-content blitz-mode">
                        <div className="step-header">
                            <span className="step-badge">第二步：神经预演</span>
                            <h2>🧠 闪电排练 (Blitz)</h2>
                            <p className="subtitle">第 {blitzRep + 1} 次 / 共 3 次</p>
                        </div>

                        <div className="blitz-instruction">
                            <div className="blitz-icon">
                                <Eye size={48} className="pulse" />
                            </div>
                            <h3>假装刚刚完成：<br /><span className="highlight">{habitData.anchor}</span></h3>
                            <div className="arrow-down">⬇️</div>
                            <h3>立刻做：<br /><span className="highlight">{habitData.tiny_behavior}</span></h3>
                            <div className="arrow-down">⬇️</div>
                            <h3>然后立刻庆祝！🎉</h3>
                        </div>

                        <button className="blitz-btn" onClick={handleBlitzNext}>
                            <FastForward size={20} /> 我做完了，再来一次
                        </button>
                    </div>
                )}

                {step === 'done' && (
                    <div className="step-content center">
                        <div className="celebration-icon">
                            <PartyPopper size={64} />
                        </div>
                        <h2>太棒了！</h2>
                        <p>你的大脑已经记住了这个回路。</p>
                        <p>明天实战见！</p>
                        <button
                            className="primary-btn wide"
                            onClick={() => {
                                confetti({
                                    particleCount: 150,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981']
                                });
                                onComplete();
                            }}
                        >
                            开始我的旅程
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default SetupModal;
