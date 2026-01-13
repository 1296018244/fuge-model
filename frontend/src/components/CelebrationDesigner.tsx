import React, { useState } from 'react';
import { Sparkles, Hand, MessageCircle, Smile, Check } from 'lucide-react';
import './CelebrationDesigner.css';

// 预设庆祝动作库
const BODY_ACTIONS = [
    { id: 'fist', label: '握拳', emoji: '✊', description: '有力地握拳' },
    { id: 'thumbs', label: '竖大拇指', emoji: '👍', description: '给自己点赞' },
    { id: 'clap', label: '鼓掌', emoji: '👏', description: '为自己鼓掌' },
    { id: 'arms', label: '举手', emoji: '🙌', description: '双手举过头顶' },
    { id: 'dance', label: '扭一扭', emoji: '💃', description: '轻轻扭动身体' },
    { id: 'smile', label: '微笑', emoji: '😊', description: '露出满足的微笑' },
];

const SELF_TALKS = [
    { id: 'yes', label: 'Yes!', description: '大声或心里说' },
    { id: 'good', label: '我真棒!', description: '肯定自己' },
    { id: 'proud', label: '为自己骄傲', description: '我做到了' },
    { id: 'easy', label: '就这么简单', description: '强化简单感' },
    { id: 'win', label: '又赢了!', description: '胜利宣言' },
    { id: 'grow', label: '每天进步', description: '成长心态' },
];

const CELEBRATION_EMOJIS = ['🎉', '⭐', '🔥', '💪', '🚀', '🌟', '✨', '🏆', '💎', '🎯'];

export interface CelebrationConfig {
    bodyAction: string;
    selfTalk: string;
    emoji: string;
    customPhrase?: string;
}

interface CelebrationDesignerProps {
    value?: CelebrationConfig | string;
    onChange: (config: CelebrationConfig) => void;
    compact?: boolean;
}

const CelebrationDesigner: React.FC<CelebrationDesignerProps> = ({ value, onChange, compact = false }) => {
    // 兼容旧的字符串格式
    const defaultConfig: CelebrationConfig = {
        bodyAction: 'fist',
        selfTalk: 'yes',
        emoji: '🎉',
    };

    const config = typeof value === 'string'
        ? { ...defaultConfig, customPhrase: value }
        : value || defaultConfig;

    const [selectedBody, setSelectedBody] = useState(config.bodyAction);
    const [selectedTalk, setSelectedTalk] = useState(config.selfTalk);
    const [selectedEmoji, setSelectedEmoji] = useState(config.emoji);
    const [customPhrase, setCustomPhrase] = useState(config.customPhrase || '');

    const handleChange = (updates: Partial<CelebrationConfig>) => {
        const newConfig: CelebrationConfig = {
            bodyAction: updates.bodyAction ?? selectedBody,
            selfTalk: updates.selfTalk ?? selectedTalk,
            emoji: updates.emoji ?? selectedEmoji,
            customPhrase: updates.customPhrase !== undefined ? updates.customPhrase : customPhrase,
        };
        onChange(newConfig);
    };

    const getPreviewText = () => {
        const body = BODY_ACTIONS.find(a => a.id === selectedBody);
        const talk = SELF_TALKS.find(t => t.id === selectedTalk);
        return `${body?.emoji || '✊'} ${body?.label || ''} + 说"${customPhrase || talk?.label || 'Yes!'}" ${selectedEmoji}`;
    };

    if (compact) {
        return (
            <div className="celebration-compact">
                <div className="celebration-preview">
                    <Sparkles size={16} />
                    <span>{getPreviewText()}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="celebration-designer">
            <div className="celebration-header">
                <Sparkles size={20} />
                <h4>设计你的庆祝仪式</h4>
            </div>
            <p className="celebration-tip">
                福格说：庆祝是习惯固化的关键！选择能让你真正感到喜悦的方式。
            </p>

            {/* 身体动作 */}
            <div className="celebration-section">
                <div className="section-label">
                    <Hand size={16} />
                    <span>身体动作</span>
                </div>
                <div className="option-grid">
                    {BODY_ACTIONS.map(action => (
                        <button
                            key={action.id}
                            className={`option-btn ${selectedBody === action.id ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedBody(action.id);
                                handleChange({ bodyAction: action.id });
                            }}
                        >
                            <span className="option-emoji">{action.emoji}</span>
                            <span className="option-label">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 自我对话 */}
            <div className="celebration-section">
                <div className="section-label">
                    <MessageCircle size={16} />
                    <span>自我对话</span>
                </div>
                <div className="option-grid">
                    {SELF_TALKS.map(talk => (
                        <button
                            key={talk.id}
                            className={`option-btn ${selectedTalk === talk.id ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedTalk(talk.id);
                                handleChange({ selfTalk: talk.id });
                            }}
                        >
                            <span className="option-label">"{talk.label}"</span>
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    className="custom-phrase-input"
                    placeholder="或输入你自己的庆祝语..."
                    value={customPhrase}
                    onChange={(e) => {
                        setCustomPhrase(e.target.value);
                        handleChange({ customPhrase: e.target.value });
                    }}
                />
            </div>

            {/* Emoji */}
            <div className="celebration-section">
                <div className="section-label">
                    <Smile size={16} />
                    <span>庆祝 Emoji</span>
                </div>
                <div className="emoji-grid">
                    {CELEBRATION_EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedEmoji(emoji);
                                handleChange({ emoji });
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* 预览 */}
            <div className="celebration-preview-box">
                <div className="preview-label">
                    <Check size={16} />
                    <span>打卡成功后你会看到:</span>
                </div>
                <div className="preview-content">
                    <span className="preview-emoji">{selectedEmoji}</span>
                    <span className="preview-text">{getPreviewText()}</span>
                </div>
            </div>
        </div>
    );
};

export default CelebrationDesigner;

// 辅助函数：将庆祝配置转为显示文本
export const celebrationToText = (celebration: CelebrationConfig | string): string => {
    if (typeof celebration === 'string') return celebration;

    const body = BODY_ACTIONS.find(a => a.id === celebration.bodyAction);
    const talk = SELF_TALKS.find(t => t.id === celebration.selfTalk);
    const phrase = celebration.customPhrase || talk?.label || 'Yes!';

    return `${body?.label || '握拳'}，说"${phrase}" ${celebration.emoji || '🎉'}`;
};

export { BODY_ACTIONS, SELF_TALKS, CELEBRATION_EMOJIS };
