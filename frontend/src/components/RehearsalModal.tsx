import React, { useState } from 'react';
import { CheckCircle, Mic, Play, Sparkles, ArrowRight, X } from 'lucide-react';
import './RehearsalModal.css';

interface RehearsalModalProps {
    isOpen: boolean;
    onClose: () => void;
    habit: {
        anchor: string;
        tiny_behavior: string;
        celebration_method: string;
    };
    onComplete: () => void;
}

const RehearsalModal: React.FC<RehearsalModalProps> = ({ isOpen, onClose, habit, onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [stepsCompleted, setStepsCompleted] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({
        1: false,
        2: false,
        3: false
    });

    if (!isOpen) return null;

    const getRecipeText = () => {
        return `当 ${habit.anchor} 后，我会 ${habit.tiny_behavior}`;
    };

    const handleStepComplete = (stepNum: 1 | 2 | 3) => {
        setStepsCompleted(prev => ({ ...prev, [stepNum]: true }));
        if (stepNum < 3) {
            setStep((stepNum + 1) as 1 | 2 | 3);
        }
    };

    const allComplete = stepsCompleted[1] && stepsCompleted[2] && stepsCompleted[3];

    return (
        <div className="modal-overlay rehearsal-overlay">
            <div className="rehearsal-modal">
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="rehearsal-header">
                    <Sparkles size={28} color="#a855f7" />
                    <h2>🌱 落地三步曲</h2>
                    <p className="subtitle">福格说：现在就做一次，大脑才会真正记住！</p>
                </div>

                {/* Progress Indicator */}
                <div className="rehearsal-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''} ${stepsCompleted[1] ? 'completed' : ''}`}>
                        <span className="step-num">1</span>
                        <span className="step-label">朗读配方</span>
                    </div>
                    <div className="progress-line" />
                    <div className={`progress-step ${step >= 2 ? 'active' : ''} ${stepsCompleted[2] ? 'completed' : ''}`}>
                        <span className="step-num">2</span>
                        <span className="step-label">立即执行</span>
                    </div>
                    <div className="progress-line" />
                    <div className={`progress-step ${step >= 3 ? 'active' : ''} ${stepsCompleted[3] ? 'completed' : ''}`}>
                        <span className="step-num">3</span>
                        <span className="step-label">庆祝一下</span>
                    </div>
                </div>

                {/* Step Content */}
                <div className="rehearsal-content">
                    {step === 1 && (
                        <div className="step-card step-1">
                            <div className="step-icon">
                                <Mic size={32} />
                            </div>
                            <h3>大声念出你的行为配方</h3>
                            <div className="recipe-display">
                                <span className="recipe-text">"{getRecipeText()}"</span>
                            </div>
                            <p className="step-tip">
                                💡 说出来比默读更能加深记忆
                            </p>
                            <button
                                className="step-action-btn"
                                onClick={() => handleStepComplete(1)}
                            >
                                <CheckCircle size={18} />
                                我已经念出来了
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-card step-2">
                            <div className="step-icon">
                                <Play size={32} />
                            </div>
                            <h3>现在就做一次（迷你版也行）</h3>
                            <div className="behavior-display">
                                <span className="behavior-emoji">🎯</span>
                                <span className="behavior-text">{habit.tiny_behavior}</span>
                            </div>
                            <p className="step-tip">
                                💡 即使只做10秒，也比不做强100倍
                            </p>
                            <button
                                className="step-action-btn"
                                onClick={() => handleStepComplete(2)}
                            >
                                <CheckCircle size={18} />
                                我做完了!
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-card step-3">
                            <div className="step-icon celebration">
                                🎉
                            </div>
                            <h3>庆祝你的第一次成功!</h3>
                            <div className="celebration-display">
                                <span className="celebration-text">{habit.celebration_method || '握拳说"Yes!"'}</span>
                            </div>
                            <p className="step-tip">
                                💡 庆祝是让大脑爱上这个习惯的秘密武器
                            </p>
                            <button
                                className="step-action-btn celebrate"
                                onClick={() => handleStepComplete(3)}
                            >
                                <Sparkles size={18} />
                                我庆祝完了!
                            </button>
                        </div>
                    )}

                    {allComplete && (
                        <div className="completion-card">
                            <div className="completion-icon">🏆</div>
                            <h3>太棒了！你已经完成了第一次预演</h3>
                            <p>习惯的种子已经种下，明天见到锚点时，大脑会自动提醒你！</p>
                            <button
                                className="finish-btn"
                                onClick={() => {
                                    onComplete();
                                    onClose();
                                }}
                            >
                                开始我的习惯之旅 <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RehearsalModal;
