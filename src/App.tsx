import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ModelsData, SortField, SortDirection } from './types';
import ModelTable from './components/ModelTable';
import ModelSelector from './components/ModelSelector';
import './App.css';

// 本地回退的默认模型列表
const FALLBACK_MODEL_IDS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.5-pro-preview-06-05',
  'deepseek/deepseek-chat',
  'deepseek/deepseek-r1',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-large-2411',
];

function App() {
  const [allModelsData, setAllModelsData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 服务端配置的默认模型 ID
  const [serverDefaultIds, setServerDefaultIds] = useState<string[]>([]);

  // 用户当前选择展示的模型（包含默认 + 用户临时添加的）
  const [displayModelIds, setDisplayModelIds] = useState<Set<string>>(new Set());

  // 排序状态
  const [sortField, setSortField] = useState<SortField>('inputPrice');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 并行获取模型数据和配置
        const [modelsRes, configRes] = await Promise.all([
          fetch('/api/models').catch(() => fetch('/data/models.json')),
          fetch('/api/config').catch(() => null)
        ]);

        if (!modelsRes.ok) throw new Error('数据加载失败');

        const modelsData: ModelsData = await modelsRes.json();
        setAllModelsData(modelsData);

        // 获取服务端配置的默认模型
        let defaultIds = FALLBACK_MODEL_IDS;
        if (configRes && configRes.ok) {
          const configData = await configRes.json();
          if (configData.defaultModels && configData.defaultModels.length > 0) {
            defaultIds = configData.defaultModels;
          }
        }

        setServerDefaultIds(defaultIds);

        // 初始化显示的模型（过滤有效的 ID）
        const validIds = defaultIds.filter(id =>
          modelsData.models.some(m => m.id === id)
        );
        setDisplayModelIds(new Set(validIds));
        setLoading(false);

      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 添加模型到对比列表
  const addModel = useCallback((modelId: string) => {
    setDisplayModelIds(prev => new Set([...prev, modelId]));
  }, []);

  // 从对比列表移除模型
  const removeModel = useCallback((modelId: string) => {
    setDisplayModelIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(modelId);
      return newSet;
    });
  }, []);

  // 重置为默认列表
  const resetToDefault = useCallback(() => {
    if (allModelsData) {
      const validIds = serverDefaultIds.filter(id =>
        allModelsData.models.some(m => m.id === id)
      );
      setDisplayModelIds(new Set(validIds));
    }
  }, [allModelsData, serverDefaultIds]);

  // 过滤显示的模型并排序
  const displayedModels = useMemo(() => {
    if (!allModelsData) return [];

    const models = allModelsData.models.filter(m => displayModelIds.has(m.id));

    // 排序
    models.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return models;
  }, [allModelsData, displayModelIds, sortField, sortDirection]);

  // 处理排序点击
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="app loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载模型数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error-container">
        <h2>加载失败</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>OpenRouter 大模型价格对比</h1>
          <p className="subtitle">
            对比主流大模型的价格与上下文长度
          </p>
          {allModelsData && (
            <p className="update-time">
              数据更新时间: {new Date(allModelsData.updatedAt).toLocaleString('zh-CN')}
              {' · '}
              可用模型: {allModelsData.totalCount}
            </p>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* 工具栏 */}
        <div className="toolbar">
          <ModelSelector
            allModels={allModelsData?.models || []}
            selectedIds={displayModelIds}
            onAdd={addModel}
          />

          <div className="toolbar-right">
            <span className="model-count">
              当前对比 {displayedModels.length} 个模型
            </span>
            <button
              className="reset-btn"
              onClick={resetToDefault}
              title="重置为管理员配置的默认列表"
            >
              🔄 重置列表
            </button>
          </div>
        </div>

        {/* 模型表格 */}
        <ModelTable
          models={displayedModels}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRemove={removeModel}
          showRemoveButton={true}
        />

        {displayedModels.length === 0 && (
          <div className="empty-state">
            <p>😅 没有选择任何模型</p>
            <p>点击上方"添加模型对比"按钮添加模型</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          数据来源: <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">OpenRouter API</a>
          {' | '}
          价格单位: 美元/百万 Token
        </p>
      </footer>
    </div>
  );
}

export default App;
