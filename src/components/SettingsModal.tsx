import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, Plus, Trash2, Check } from 'lucide-react';
import { cloudSettings, cloudAIConfigs, getCloudCounts, cloudHabits, cloudAspirations } from '../hooks/supabaseStorage';
import type { AIConfig } from '../types';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    // Config State
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [modelName, setModelName] = useState('');

    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ cloudHabits: number, cloudAspirations: number }>({ cloudHabits: 0, cloudAspirations: 0 });

    useEffect(() => {
        if (isOpen) {
            fetchConfigs();
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

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setLoading(true);
        try {
            const habits = await cloudHabits.fetchAll();
            const aspirations = await cloudAspirations.fetchAll();
            const ai_configs = await cloudAIConfigs.fetchAll();
            const settings = await cloudSettings.fetchAll();

            const backupData: import('../types').BackupData = {
                version: 1,
                timestamp: new Date().toISOString(),
                habits,
                aspirations,
                ai_configs,
                settings: {
                    openai_api_key: settings.openai_api_key,
                    openai_base_url: settings.openai_base_url,
                    model_name: settings.model_name
                }
            };

            const jsonContent = JSON.stringify(backupData, null, 2);
            const fileName = `fogg_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;

            // 检测是否在 Capacitor 环境中
            const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

            if (isCapacitor) {
                // 使用 Capacitor Filesystem + Share
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');

                // 写入文件到缓存目录
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: jsonContent,
                    directory: Directory.Cache,
                    encoding: 'utf8' as any
                });

                // 使用系统分享
                await Share.share({
                    title: '福格行为数据备份',
                    text: '导出的习惯数据',
                    url: result.uri,
                    dialogTitle: '分享备份文件'
                });

                alert('导出成功！请选择保存位置');
            } else {
                // 浏览器环境 - 使用传统下载方式
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error('Export failed:', e);
            alert('导出失败: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setLoading(false);
        }
    };

    const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm('导入将覆盖或合并现有数据。确定要继续吗？\n建议先导出当前数据作为备份。')) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json) as import('../types').BackupData;

                // Validate basic structure
                if (!data.habits || !Array.isArray(data.habits)) {
                    throw new Error('Invalid backup file format');
                }

                // 1. Restore Habits
                await cloudHabits.upsertMany(data.habits);

                // 2. Restore Aspirations
                if (data.aspirations?.length) {
                    await cloudAspirations.addMany(data.aspirations);
                }

                // 3. Restore AI Configs
                if (data.ai_configs?.length) {
                    for (const config of data.ai_configs) {
                        // config.id is kept to update existing ones, or insert new ones
                        await cloudAIConfigs.upsert({
                            ...config,
                            created_at: undefined, // Let DB handle timestamps
                            updated_at: undefined
                        });
                    }
                }

                // 4. Restore Settings (Legacy)
                if (data.settings && Object.keys(data.settings).length > 0) {
                    // Filter out undefined values
                    const settingsToSave: Record<string, string> = {};
                    if (data.settings.openai_api_key) settingsToSave.openai_api_key = data.settings.openai_api_key;
                    if (data.settings.openai_base_url) settingsToSave.openai_base_url = data.settings.openai_base_url;
                    if (data.settings.model_name) settingsToSave.model_name = data.settings.model_name;

                    if (Object.keys(settingsToSave).length > 0) {
                        await cloudSettings.save(settingsToSave);
                    }
                }

                alert(`成功导入:\n- ${data.habits.length} 个习惯\n- ${data.aspirations?.length || 0} 个愿景\n- ${data.ai_configs?.length || 0} 个配置`);
                await fetchConfigs();
                await fetchStats();

            } catch (err) {
                console.error('Import failed:', err);
                alert('导入失败: 文件格式错误或数据损坏');
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const fetchConfigs = async () => {
        try {
            const list = await cloudAIConfigs.fetchAll();
            setConfigs(list);

            // 如果有激活的配置，选中它；否则如果没有选中项且列表不为空，选中第一个
            const active = list.find(c => c.is_active);
            if (active) {
                selectConfig(active);
            } else if (list.length > 0 && !selectedConfigId) {
                selectConfig(list[0]);
            } else if (list.length === 0) {
                // 如果是空的，进入新建模式
                startNewConfig();
            }
        } catch (e) {
            console.error('Failed to fetch configs', e);
        }
    };

    const selectConfig = (config: AIConfig) => {
        setSelectedConfigId(config.id);
        setName(config.name);
        setApiKey(config.api_key);
        setBaseUrl(config.base_url);
        setModelName(config.model_name);
    };

    const startNewConfig = () => {
        setSelectedConfigId(null);
        setName('New Config');
        setApiKey('');
        setBaseUrl('https://api.openai.com/v1');
        setModelName('gpt-3.5-turbo');
    };

    const handleSave = async () => {
        if (!name || !apiKey) {
            alert('请填写配置名称和 API Key');
            return;
        }

        setLoading(true);
        try {
            // 检查是否是迁移的临时配置（这些 ID 不是有效的 UUID，所以保存时应视为新建）
            const isLegacy = selectedConfigId === 'legacy-migrated' || selectedConfigId === 'legacy-temp';
            const isNew = !selectedConfigId || isLegacy;

            const configData: Partial<AIConfig> = {
                name,
                api_key: apiKey,
                base_url: baseUrl,
                model_name: modelName,
                // 如果是第一个配置，或者正在保存迁移的配置，默认设为激活
                is_active: (isNew && configs.length <= 1) ? true : undefined
            };

            // 只有当不是新建且不是迁移配置时，才传递 ID
            if (!isNew && selectedConfigId) {
                configData.id = selectedConfigId;
            }

            const success = await cloudAIConfigs.upsert(configData);

            if (!success) {
                alert('保存失败！请检查网络或 Supabase 表结构。');
                return;
            }

            // alert('配置已保存！');
            await fetchConfigs(); // Refresh list

            // 如果是新建的，可能需要重新定位选中项（这里简单处理，fetchConfigs 会自动选）

        } catch (e: any) {
            console.error('Save failed:', e);
            alert('保存失败: ' + (e.message || String(e)));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedConfigId) return;

        if (!confirm('确定要删除这个配置吗？')) return;

        setLoading(true);
        try {
            await cloudAIConfigs.delete(selectedConfigId);
            await fetchConfigs();
            if (configs.length <= 1) startNewConfig();
        } catch (e) {
            alert('删除失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async () => {
        if (!selectedConfigId) return;
        setLoading(true);
        try {
            await cloudAIConfigs.setActive(selectedConfigId);
            await fetchConfigs();
        } catch (e) {
            alert('切换失败');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isEditingActive = configs.find(c => c.id === selectedConfigId)?.is_active;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Config List */}
                <div className="section-title">可用配置</div>
                <div className="config-list-section">
                    {configs.length === 0 && <div style={{ padding: '1rem', color: '#64748b', textAlign: 'center' }}>暂无配置，请添加</div>}
                    {configs.map(config => (
                        <div
                            key={config.id}
                            className={`config-item ${config.id === selectedConfigId ? 'selected' : ''} ${config.is_active ? 'active' : ''}`}
                            onClick={() => selectConfig(config)}
                        >
                            <div className="config-info">
                                <div className="config-name">
                                    {config.name}
                                    {config.is_active && <span className="badge-active">ACTIVE</span>}
                                </div>
                                <div className="config-model">{config.model_name} • {new URL(config.base_url).hostname}</div>
                            </div>
                            <div className="config-actions">
                                {config.id === selectedConfigId && (
                                    <div style={{ fontSize: '0.8rem', color: '#a855f7', display: 'flex', alignItems: 'center' }}>Editing</div>
                                )}
                            </div>
                        </div>
                    ))}
                    <button className="add-config-btn" onClick={startNewConfig}>
                        <Plus size={16} /> 添加新配置
                    </button>
                </div>

                {/* Edit Form */}
                <div className="section-title">{selectedConfigId ? '编辑配置' : '新建配置'}</div>
                <div className="edit-form">
                    <div className="form-group">
                        <label>配置名称 (Name)</label>
                        <input
                            className="form-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="例如: Cerebras, DeepSeek..."
                        />
                    </div>

                    <div className="form-group">
                        <label>API Key</label>
                        <input
                            className="form-input"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Base URL</label>
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
                    </div>

                    <div className="form-actions">
                        {selectedConfigId && (
                            <button
                                className={`activate-btn ${isEditingActive ? 'disabled' : ''}`}
                                onClick={handleSetActive}
                                disabled={isEditingActive || loading}
                            >
                                <Check size={16} />
                                {isEditingActive ? '当前已激活' : '设为激活 (Set Active)'}
                            </button>
                        )}
                        {!selectedConfigId && <div></div>} {/* Spacer */}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {selectedConfigId && (
                                <button className="icon-btn delete" onClick={handleDelete} title="删除配置">
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <button className="save-btn" onClick={handleSave} disabled={loading}>
                                {selectedConfigId ? '保存修改' : '创建配置'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cloud Status Indicator */}
                <div className="data-management-section">
                    <h3>☁️ 数据管理</h3>
                    <div className="cloud-dashboard">
                        <div className="status-grid">
                            <div className="status-card">
                                <span className="label">习惯 (Habits)</span>
                                <span className="stat-val">{stats.cloudHabits}</span>
                            </div>
                            <div className="status-card">
                                <span className="label">愿景 (Aspirations)</span>
                                <span className="stat-val">{stats.cloudAspirations}</span>
                            </div>
                        </div>

                        <div className="data-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="data-btn export" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #4ade80', borderRadius: '0.5rem', background: 'transparent', color: '#4ade80', cursor: 'pointer' }}>
                                <Cloud size={16} /> 导出数据 (JSON)
                            </button>
                            <button className="data-btn import" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #60a5fa', borderRadius: '0.5rem', background: 'transparent', color: '#60a5fa', cursor: 'pointer' }}>
                                <Cloud size={16} /> 导入恢复
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={handleImportFile}
                            />
                        </div>
                    </div>
                </div>

                <div className="save-actions">
                    <button onClick={onClose} className="close-btn">
                        &times;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
