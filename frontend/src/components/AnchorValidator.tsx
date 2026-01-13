import React, { useState, useEffect } from 'react';
import { Anchor, CheckCircle, AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';
import './AnchorValidator.css';

interface AnchorValidatorProps {
    anchor: string;
    onChange: (anchor: string) => void;
    onValidityChange?: (isValid: boolean, score: number) => void;
}

interface ValidationResult {
    isFrequent: boolean | null;  // 是否每天发生
    isSpecific: boolean | null;  // 是否足够具体
    isReliable: boolean | null;  // 是否可靠稳定
}

// 锚点质量分析关键词
const GOOD_ANCHOR_PATTERNS = [
    /当我.*后/,
    /在我.*时/,
    /每天.*后/,
    /刚.*完/,
    /起床/,
    /刷牙/,
    /洗脸/,
    /喝咖啡/,
    /吃.*后/,
    /下班/,
    /回家/,
    /坐下/,
    /打开.*时/,
];

const VAGUE_WORDS = ['有时', '可能', '大概', '如果', '或者', '有空'];

const AnchorValidator: React.FC<AnchorValidatorProps> = ({ anchor, onChange, onValidityChange }) => {
    const [validation, setValidation] = useState<ValidationResult>({
        isFrequent: null,
        isSpecific: null,
        isReliable: null
    });
    const [showTips, setShowTips] = useState(false);
    // AI suggestion feature - reserved for future implementation
    const aiSuggestion: string | null = null;

    // 自动分析锚点质量
    useEffect(() => {
        if (!anchor.trim()) {
            setValidation({ isFrequent: null, isSpecific: null, isReliable: null });
            return;
        }

        // 简单的启发式分析
        const hasGoodPattern = GOOD_ANCHOR_PATTERNS.some(p => p.test(anchor));
        const hasVagueWords = VAGUE_WORDS.some(w => anchor.includes(w));
        const isLongEnough = anchor.length >= 5;
        const hasTimeIndicator = /后|时|完|前/.test(anchor);

        const newValidation: ValidationResult = {
            isFrequent: isLongEnough && !hasVagueWords,
            isSpecific: hasGoodPattern || (isLongEnough && hasTimeIndicator),
            isReliable: !hasVagueWords && hasTimeIndicator
        };

        setValidation(newValidation);

        // 计算得分
        const score = [newValidation.isFrequent, newValidation.isSpecific, newValidation.isReliable]
            .filter(Boolean).length;

        onValidityChange?.(score >= 2, score);
    }, [anchor, onValidityChange]);

    const getScoreColor = () => {
        const score = [validation.isFrequent, validation.isSpecific, validation.isReliable]
            .filter(Boolean).length;
        if (score === 3) return '#10b981';
        if (score === 2) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = () => {
        const score = [validation.isFrequent, validation.isSpecific, validation.isReliable]
            .filter(Boolean).length;
        if (score === 3) return '优质锚点';
        if (score === 2) return '还可以';
        if (score === 1) return '需优化';
        return '待完善';
    };

    const getValidationIcon = (value: boolean | null) => {
        if (value === null) return <HelpCircle size={16} color="#64748b" />;
        return value
            ? <CheckCircle size={16} color="#10b981" />
            : <AlertTriangle size={16} color="#f59e0b" />;
    };

    return (
        <div className="anchor-validator">
            <div className="anchor-input-wrapper">
                <input
                    type="text"
                    id="anchor-input"
                    name="anchor_input_field"
                    autoComplete="off"
                    data-1p-ignore
                    className="anchor-input"
                    placeholder="例如: 当我早上刷完牙后..."
                    value={anchor}
                    onChange={(e) => onChange(e.target.value)}
                />
                {anchor && (
                    <div
                        className="anchor-score-badge"
                        style={{ backgroundColor: getScoreColor() }}
                    >
                        {getScoreLabel()}
                    </div>
                )}
            </div>

            {/* 验证提示 */}
            {anchor && (
                <div className="validation-hints">
                    <div className={`hint-item ${validation.isFrequent ? 'valid' : validation.isFrequent === false ? 'warning' : ''}`}>
                        {getValidationIcon(validation.isFrequent)}
                        <span>每天发生</span>
                    </div>
                    <div className={`hint-item ${validation.isSpecific ? 'valid' : validation.isSpecific === false ? 'warning' : ''}`}>
                        {getValidationIcon(validation.isSpecific)}
                        <span>足够具体</span>
                    </div>
                    <div className={`hint-item ${validation.isReliable ? 'valid' : validation.isReliable === false ? 'warning' : ''}`}>
                        {getValidationIcon(validation.isReliable)}
                        <span>稳定可靠</span>
                    </div>
                    <button
                        className="tips-toggle"
                        onClick={() => setShowTips(!showTips)}
                    >
                        {showTips ? '收起提示' : '如何写好锚点?'}
                    </button>
                </div>
            )}

            {/* 锚点写作技巧 */}
            {showTips && (
                <div className="anchor-tips">
                    <h5>🎯 好锚点的三个标准</h5>
                    <ul>
                        <li><strong>每天发生</strong> - 不是"有时候"，而是每天必然会做的事</li>
                        <li><strong>足够具体</strong> - "刷完牙后"比"早上"更好</li>
                        <li><strong>稳定可靠</strong> - 不受心情、天气影响的固定行为</li>
                    </ul>
                    <div className="tip-examples">
                        <span className="good">✅ 当我早上刷完牙后</span>
                        <span className="good">✅ 坐到办公桌前那一刻</span>
                        <span className="bad">❌ 有空的时候</span>
                        <span className="bad">❌ 心情好时</span>
                    </div>
                </div>
            )}

            {/* AI 优化建议 */}
            {aiSuggestion && (
                <div className="ai-suggestion">
                    <Sparkles size={16} />
                    <span>AI 建议: {aiSuggestion}</span>
                </div>
            )}
        </div>
    );
};

export default AnchorValidator;
