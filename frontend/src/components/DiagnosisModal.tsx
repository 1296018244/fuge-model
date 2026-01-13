import React, { useState } from 'react';
import { X, Activity, Zap, AlertTriangle, ArrowRight, Check, ClipboardList } from 'lucide-react';
import { diagnoseFailure } from '../services/aiService';
import './DiagnosisModal.css';

interface DiagnosisModalProps {
    isOpen: boolean;
    onClose: () => void;
    habit: any;
    onApplyFix: (habitId: string, updates: any) => void;
}

const DiagnosisModal: React.FC<DiagnosisModalProps> = ({ isOpen, onClose, habit, onApplyFix }) => {
    const [step, setStep] = useState<'reason' | 'loading' | 'solution'>('reason');
    const [plan, setPlan] = useState<any>(null);
    const [selectedReason, setSelectedReason] = useState<string>('');

    if (!isOpen || !habit) return null;

    const handleReasonSelect = async (reason: string) => {
        setSelectedReason(reason);
        setStep('loading');
        try {
            const result = await diagnoseFailure(habit, reason);
            setPlan(result);
            setStep('solution');
        } catch (e) {
            console.error(e);
            alert("AI 医生现在有点忙，请稍后再试。");
            onClose();
        }
    };

    const handleApply = () => {
        if (plan && plan.new_plan) {
            onApplyFix(habit.id, plan.new_plan);
        }
        onClose();
        // Reset state
        setTimeout(() => setStep('reason'), 500);
    };

    return (
        <div className="modal-overlay">
            <div className={`diagnosis-card ${step}`}>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                {step === 'reason' && (
                    <div className="step-content">
                        <h2>💊 行为急诊室</h2>
                        <p className="subtitle">哎呀，没做到？没关系！找到原因就能治好。</p>

                        <div className="reason-grid">
                            <button className="reason-card" onClick={() => handleReasonSelect('forgot')}>
                                <div className="icon-wrapper blue"><Zap size={24} /></div>
                                <h3>我忘了</h3>
                                <p>完全记不起来要做这件事</p>
                            </button>

                            <button className="reason-card" onClick={() => handleReasonSelect('hard')}>
                                <div className="icon-wrapper red"><Activity size={24} /></div>
                                <h3>太难 / 太累</h3>
                                <p>有心无力，就是不想动</p>
                            </button>

                            <button className="reason-card" onClick={() => handleReasonSelect('unmotivated')}>
                                <div className="icon-wrapper yellow"><AlertTriangle size={24} /></div>
                                <h3>觉得没意义</h3>
                                <p>失去了最初的动力</p>
                            </button>

                            <button className="reason-card" onClick={() => handleReasonSelect('ineffective')}>
                                <div className="icon-wrapper gray"><Activity size={24} /></div>
                                <h3>做了但没用</h3>
                                <p>换了睡衣还是熬夜？</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'loading' && (
                    <div className="step-content center">
                        <div className="loader"></div>
                        <h3>AI 正在分析病历...</h3>
                        <p>正在为 {habit.tiny_behavior} 寻找解药</p>
                    </div>
                )}

                {step === 'solution' && plan && (
                    <div className="step-content">
                        <div className="diagnosis-header">
                            <span className="badge">诊断报告</span>
                            <h3>{plan.diagnosis}</h3>
                        </div>

                        {plan.new_plan ? (
                            <div className="prescription-card">
                                <h4>✨ AI 处方：更简单的版本</h4>
                                <div className="comparison">
                                    <div className="old">
                                        <span className="label">原计划</span>
                                        <p>{habit.anchor}</p>
                                        <p>{habit.tiny_behavior}</p>
                                    </div>
                                    <div className="arrow"><ArrowRight size={20} /></div>
                                    <div className="new">
                                        <span className="label">新方案</span>
                                        <p className="highlight">{plan.new_plan.anchor}</p>
                                        <p className="highlight">{plan.new_plan.tiny_behavior}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="suggestion-box">
                                <p>{plan.diagnosis}</p>
                            </div>
                        )}

                        {/* Environment Checklist Hint for 'hard' reason */}
                        {selectedReason === 'hard' && habit.environment_setup?.ready_checklist?.length > 0 && (
                            <div className="env-hint-box">
                                <div className="env-hint-header">
                                    <ClipboardList size={18} />
                                    <span>检查你的环境清单</span>
                                </div>
                                <p className="env-hint-text">你当初设置了这些环境准备，都做到了吗？</p>
                                <ul className="env-hint-list">
                                    {habit.environment_setup.ready_checklist.map((item: string, idx: number) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="action-footer">
                            <button className="secondary-btn" onClick={onClose}>保持原样</button>
                            {plan.new_plan && (
                                <button className="primary-btn" onClick={handleApply}>
                                    <Check size={18} /> 采纳处方 (更新习惯)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagnosisModal;
