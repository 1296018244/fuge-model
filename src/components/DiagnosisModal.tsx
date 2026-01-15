import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Check, Sparkles } from 'lucide-react';
import { diagnosisChat } from '../services/aiService';
import type { ChatMessage } from '../services/aiService';
import './DiagnosisModal.css';

interface DiagnosisModalProps {
    isOpen: boolean;
    onClose: () => void;
    habit: any;
    onApplyFix: (habitId: string, updates: any) => void;
}

const DiagnosisModal: React.FC<DiagnosisModalProps> = ({ isOpen, onClose, habit, onApplyFix }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{ anchor: string; tiny_behavior: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            // Add initial AI greeting
            if (messages.length === 0) {
                setMessages([{
                    role: 'assistant',
                    content: `嗨！我看到你在尝试「${habit?.tiny_behavior}」这个习惯 💪 今天遇到什么情况了？说说看~`
                }]);
            }
        }
    }, [isOpen, habit]);

    // Reset when modal closes
    const handleClose = () => {
        setMessages([]);
        setInput('');
        setSuggestion(null);
        onClose();
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const result = await diagnosisChat(habit, newMessages);

            setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);

            if (result.suggestion) {
                setSuggestion(result.suggestion);
            }
        } catch (e: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `😅 抱歉，我这边出了点问题：${e.message}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleApply = () => {
        if (suggestion) {
            // Find the last assistant message (diagnosis)
            const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
            const diagnosisText = lastAssistantMsg ? lastAssistantMsg.content : "AI Suggestion";

            onApplyFix(habit.id, { ...suggestion, diagnosis: diagnosisText });
        }
        handleClose();
    };

    if (!isOpen || !habit) return null;

    return (
        <div className="modal-overlay">
            <div className="diagnosis-chat-card">
                <div className="chat-header">
                    <div className="chat-title">
                        <Sparkles size={20} />
                        <span>和 AI 聊聊</span>
                    </div>
                    <button className="close-btn" onClick={handleClose}><X size={20} /></button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-bubble ${msg.role}`}>
                            {msg.content}
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble assistant typing">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {suggestion && (
                    <div className="suggestion-banner">
                        <div className="suggestion-content">
                            <span className="suggestion-label">💡 建议的新方案</span>
                            <p><strong>锚点:</strong> {suggestion.anchor}</p>
                            <p><strong>微行为:</strong> {suggestion.tiny_behavior}</p>
                        </div>
                        <button className="apply-btn" onClick={handleApply}>
                            <Check size={16} /> 采纳
                        </button>
                    </div>
                )}

                <div className="chat-input-area">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="说说发生了什么..."
                        rows={1}
                        disabled={loading}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiagnosisModal;
