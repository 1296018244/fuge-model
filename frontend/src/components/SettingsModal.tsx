import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle } from 'lucide-react';
import { cloudSettings, getCloudCounts } from '../hooks/supabaseStorage';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [modelName, setModelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ cloudHabits: number, cloudAspirations: number }>({ cloudHabits: 0, cloudAspirations: 0 });

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
            fetchStats();
        }
    }, [isOpen]);

    const fetchStats = async () => {
        try {
            const cloudCounts = await getCloudCounts();
            setStats({
                cloudHabits: cloudCounts.habits,
                cloudAspirations: cloudCounts.aspirations
            });
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    };

    const fetchConfig = async () => {
        try {
            const cloudConfig = await cloudSettings.fetchAll();
            setApiKey(cloudConfig.openai_api_key || '');
            setBaseUrl(cloudConfig.openai_base_url || '');
            setModelName(cloudConfig.model_name || '');
        } catch (e) {
            console.error('Failed to fetch cloud settings', e);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const success = await cloudSettings.save({
                openai_api_key: apiKey,
                openai_base_url: baseUrl,
                model_name: modelName
            });

            if (!success) {
                alert('保存失败！\n请确保 Supabase 中已创建 settings 表。');
                return;
            }

            alert('配置已保存到云端！');
            onClose();
        } catch (e: any) {
            console.error('Save failed:', e);
            alert('保存失败: ' + (e.message || String(e)));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">系统设置</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="form-group">
                    <label>OpenAI API Key</label>
                    <input
                        className="form-input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                    />
                </div>

                <div className="form-group">
                    <label>API Base URL</label>
                    <input
                        className="form-input"
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                    />
                </div>

                <div className="form-group">
                    <label>Model Name</label>
                    <input
                        className="form-input"
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="gpt-3.5-turbo"
                    />
                </div>

                {/* Cloud Status Indicator */}
                <div className="data-management-section">
                    <h3>☁️ 数据状态</h3>
                    <div className="cloud-dashboard">
                        <div className="status-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="status-card" style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Cloud size={24} color="#10b981" />
                                    <div>
                                        <h4 style={{ margin: 0, color: 'white' }}>纯云端模式 (Cloud-Only)</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>数据实时保存至 Supabase</p>
                                    </div>
                                </div>
                                <div className="status-badge success">
                                    <CheckCircle size={16} />
                                    已连接
                                </div>
                            </div>
                        </div>

                        <div className="status-grid">
                            <div className="status-card">
                                <span className="label">习惯 (Habits)</span>
                                <span className="stat-val" style={{ fontSize: '2rem' }}>{stats.cloudHabits}</span>
                            </div>
                            <div className="status-card">
                                <span className="label">愿景 (Aspirations)</span>
                                <span className="stat-val" style={{ fontSize: '2rem' }}>{stats.cloudAspirations}</span>
                            </div>
                        </div>


                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>关闭</button>
                    <button className="save-btn" onClick={handleSave} disabled={loading}>
                        {loading ? '保存配置' : '保存配置'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default SettingsModal;

