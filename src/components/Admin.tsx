import { useState, useMemo } from 'react';
import type { Model } from '../types';
import './Admin.css';

// 默认推荐的模型 ID 列表（主流常用模型）
const RECOMMENDED_MODELS = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.5-pro-preview-06-05',
    'google/gemini-2.5-flash-preview-05-20',
    'deepseek/deepseek-chat',
    'deepseek/deepseek-r1',
    'meta-llama/llama-3.3-70b-instruct',
    'mistralai/mistral-large-2411',
];

interface AdminProps {
    onClose: () => void;
    allModels: Model[];
    selectedModelIds: string[];
    onSave: (modelIds: string[]) => void;
}

function Admin({ onClose, allModels, selectedModelIds, onSave }: AdminProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedModelIds));
    const [searchQuery, setSearchQuery] = useState('');
    const [providerFilter, setProviderFilter] = useState('all');

    // 获取所有厂商
    const providers = useMemo(() => {
        const providerSet = new Set(allModels.map(m => m.provider));
        return Array.from(providerSet).sort();
    }, [allModels]);

    // 过滤后的模型列表
    const filteredModels = useMemo(() => {
        let models = [...allModels];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            models = models.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.id.toLowerCase().includes(query)
            );
        }

        if (providerFilter !== 'all') {
            models = models.filter(m => m.provider === providerFilter);
        }

        return models;
    }, [allModels, searchQuery, providerFilter]);

    // 切换选择
    const toggleModel = (modelId: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(modelId)) {
            newSelected.delete(modelId);
        } else {
            newSelected.add(modelId);
        }
        setSelected(newSelected);
    };

    // 全选/取消全选
    const toggleAll = () => {
        if (filteredModels.every(m => selected.has(m.id))) {
            // 取消当前过滤结果的所有选择
            const newSelected = new Set(selected);
            filteredModels.forEach(m => newSelected.delete(m.id));
            setSelected(newSelected);
        } else {
            // 选择当前过滤结果的全部
            const newSelected = new Set(selected);
            filteredModels.forEach(m => newSelected.add(m.id));
            setSelected(newSelected);
        }
    };

    // 使用推荐模型
    const useRecommended = () => {
        const available = RECOMMENDED_MODELS.filter(id =>
            allModels.some(m => m.id === id)
        );
        setSelected(new Set(available));
    };

    // 清空选择
    const clearAll = () => {
        setSelected(new Set());
    };

    // 保存
    const handleSave = () => {
        onSave(Array.from(selected));
        onClose();
    };

    return (
        <div className="admin-overlay">
            <div className="admin-panel">
                <div className="admin-header">
                    <h2>📋 管理默认展示模型</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="admin-toolbar">
                    <input
                        type="text"
                        placeholder="搜索模型..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-search"
                    />
                    <select
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        className="admin-select"
                    >
                        <option value="all">全部厂商</option>
                        {providers.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="admin-actions">
                    <button onClick={useRecommended} className="btn btn-primary">
                        使用推荐模型
                    </button>
                    <button onClick={toggleAll} className="btn btn-secondary">
                        {filteredModels.every(m => selected.has(m.id)) ? '取消全选' : '全选当前'}
                    </button>
                    <button onClick={clearAll} className="btn btn-danger">
                        清空选择
                    </button>
                    <span className="selected-count">
                        已选 {selected.size} 个模型
                    </span>
                </div>

                <div className="admin-model-list">
                    {filteredModels.map(model => (
                        <div
                            key={model.id}
                            className={`admin-model-item ${selected.has(model.id) ? 'selected' : ''}`}
                            onClick={() => toggleModel(model.id)}
                        >
                            <input
                                type="checkbox"
                                checked={selected.has(model.id)}
                                onChange={() => toggleModel(model.id)}
                            />
                            <div className="model-info">
                                <span className="model-name">{model.name}</span>
                                <span className="model-id">{model.id}</span>
                            </div>
                            <span className={`provider-badge provider-${model.provider}`}>
                                {model.provider}
                            </span>
                            <div className="model-pricing">
                                <span>${model.inputPrice}/M</span>
                                <span>${model.outputPrice}/M</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="admin-footer">
                    <button onClick={onClose} className="btn btn-secondary">
                        取消
                    </button>
                    <button onClick={handleSave} className="btn btn-primary">
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Admin;
