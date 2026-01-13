import React, { useState } from 'react';
import { analyzeBehavior, type AnalysisResult } from '../services/aiService';
import FoggChart from './FoggChart';
import RecipeCard from './RecipeCard';
import { PlusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './BehaviorWizard.css';
import SetupModal from './SetupModal'; // Import SetupModal

interface WizardProps {
    onSave: (
        anchor: string,
        behavior: string,
        original: string,
        motivation: number,
        ability: number,
        suggestion: string,
        environment_setup?: string[]
    ) => void;
}

const BehaviorWizard: React.FC<WizardProps> = ({ onSave }) => {
    const [behavior, setBehavior] = useState('');
    const [motivation, setMotivation] = useState(5);
    const [ability, setAbility] = useState(5);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Setup Modal State
    const [isSetupOpen, setIsSetupOpen] = useState(false);

    const handleAnalyze = async () => {
        if (!behavior.trim()) {
            alert('请输入想要建立的行为');
            return;
        }

        setLoading(true);
        try {
            const data = await analyzeBehavior(behavior, motivation, ability);
            setResult(data);
        } catch (error: any) {
            console.error("Analysis failed:", error);
            alert(`分析失败: ${error.message || '请检查网络或配置'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSetup = () => {
        if (result && result.recipe) {
            setIsSetupOpen(true);
        }
    };

    const handleSetupComplete = () => {
        if (result && result.recipe) {
            onSave(
                result.recipe.anchor,
                result.recipe.tiny_behavior,
                behavior,
                motivation,
                ability,
                result.suggestion,
                result.environment_setup
            );
            // Reset
            setBehavior('');
            setResult(null);
            setIsSetupOpen(false);
            setMotivation(5);
            setAbility(5);
        }
    };

    return (
        <div className="wizard-container">
            <h2 className="wizard-title">福格行为设计助手</h2>

            <div className="wizard-form">
                <div className="input-group">
                    <label className="input-label">你想建立什么新行为？</label>
                    <input
                        className="text-input"
                        placeholder="例如: 每天喝8杯水"
                        value={behavior}
                        onChange={(e) => setBehavior(e.target.value)}
                    />
                </div>

                <div className="slider-group">
                    <label className="input-label">动机 (Motivation): 你有多想做这件事？</label>
                    <div className="slider-row">
                        <span className="slider-label">低</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            className="range-slider"
                            value={motivation}
                            onChange={(e) => setMotivation(Number(e.target.value))}
                        />
                        <span className="slider-label">高</span>
                        <span className="score-display">{motivation}</span>
                    </div>
                </div>

                <div className="slider-group">
                    <label className="input-label">能力 (Ability): 做这件事有多容易？</label>
                    <div className="slider-row">
                        <span className="slider-label">难</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            className="range-slider"
                            value={ability}
                            onChange={(e) => setAbility(Number(e.target.value))}
                        />
                        <span className="slider-label">易</span>
                        <span className="score-display">{ability}</span>
                    </div>
                </div>
            </div>

            <FoggChart motivation={motivation} ability={ability} />

            <div style={{ height: '2rem' }}></div>

            <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={loading || !behavior.trim()}
            >
                分析行为
            </button>

            {result && (
                <div className="result-card">
                    <h3>💡 行为设计建议</h3>

                    {result.analysis && (
                        <div className="analysis-quote">
                            " {result.analysis} "
                        </div>
                    )}

                    <div className="result-content">
                        <ReactMarkdown>{result.suggestion}</ReactMarkdown>
                    </div>

                    {result.recipe && (
                        <div className="recipe-section">
                            <RecipeCard recipe={result.recipe} />
                            <button
                                className="action-btn-primary"
                                onClick={handleStartSetup}
                            >
                                <PlusCircle size={20} />
                                开始落地 (环境+预演)
                            </button>
                        </div>
                    )}
                </div>
            )}

            <SetupModal
                isOpen={isSetupOpen}
                onClose={() => setIsSetupOpen(false)}
                habitData={{
                    anchor: result?.recipe?.anchor || '',
                    tiny_behavior: result?.recipe?.tiny_behavior || '',
                    environment_setup: result?.environment_setup
                }}
                onComplete={handleSetupComplete}
            />
        </div>
    );
};

export default BehaviorWizard;
