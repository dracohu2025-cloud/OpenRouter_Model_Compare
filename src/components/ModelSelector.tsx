import { useState, useMemo, useRef, useEffect } from 'react';
import type { Model } from '../types';
import './ModelSelector.css';

interface ModelSelectorProps {
    allModels: Model[];
    selectedIds: Set<string>;
    onAdd: (modelId: string) => void;
}

function ModelSelector({ allModels, selectedIds, onAdd }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // 可添加的模型（排除已选的）
    const availableModels = useMemo(() => {
        let models = allModels.filter(m => !selectedIds.has(m.id));

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            models = models.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.id.toLowerCase().includes(query) ||
                m.provider.toLowerCase().includes(query)
            );
        }

        return models.slice(0, 50); // 限制显示数量
    }, [allModels, selectedIds, searchQuery]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (modelId: string) => {
        onAdd(modelId);
        setSearchQuery('');
    };

    return (
        <div className="model-selector" ref={containerRef}>
            <button
                className="add-model-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                ➕ 添加模型对比
            </button>

            {isOpen && (
                <div className="selector-dropdown">
                    <input
                        type="text"
                        placeholder="搜索模型名称、ID 或厂商..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="selector-search"
                        autoFocus
                    />

                    <div className="selector-list">
                        {availableModels.length === 0 ? (
                            <div className="selector-empty">
                                {searchQuery ? '没有找到匹配的模型' : '所有模型已添加'}
                            </div>
                        ) : (
                            availableModels.map(model => (
                                <div
                                    key={model.id}
                                    className="selector-item"
                                    onClick={() => handleSelect(model.id)}
                                >
                                    <div className="selector-item-info">
                                        <span className="selector-item-name">{model.name}</span>
                                        <span className="selector-item-id">{model.id}</span>
                                    </div>
                                    <div className="selector-item-meta">
                                        <span className={`provider-tag provider-${model.provider}`}>
                                            {model.provider}
                                        </span>
                                        <span className="price-tag">
                                            ${model.inputPrice}/${model.outputPrice}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="selector-footer">
                        共 {allModels.length - selectedIds.size} 个可添加模型
                    </div>
                </div>
            )}
        </div>
    );
}

export default ModelSelector;
