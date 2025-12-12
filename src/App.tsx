import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ModelsData, SortField, SortDirection } from './types';
import ModelTable from './components/ModelTable';
import ModelSelector from './components/ModelSelector';
import Admin from './components/Admin';
import './App.css';

// 默认展示的模型 ID（主流常用模型）
const DEFAULT_MODEL_IDS = [
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

// localStorage key
const STORAGE_KEY = 'openrouter_default_models';

function App() {
  const [allModelsData, setAllModelsData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 默认模型配置（从 localStorage 读取）
  const [defaultModelIds, setDefaultModelIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_MODEL_IDS;
  });

  // 用户当前选择展示的模型（包含默认 + 用户临时添加的）
  const [displayModelIds, setDisplayModelIds] = useState<Set<string>>(new Set());

  // Admin 面板状态
  const [showAdmin, setShowAdmin] = useState(false);

  // 排序状态
  const [sortField, setSortField] = useState<SortField>('inputPrice');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        let response = await fetch('/api/models');

        if (!response.ok) {
          console.log('API unavailable, falling back to static file');
          response = await fetch('/data/models.json');
        }

        if (!response.ok) throw new Error('数据加载失败');

        const data: ModelsData = await response.json();
        setAllModelsData(data);

        // 初始化显示的模型
        const validIds = defaultModelIds.filter(id =>
          data.models.some(m => m.id === id)
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

  // 更新显示的模型列表（当默认配置变化时）
  useEffect(() => {
    if (allModelsData) {
      const validIds = defaultModelIds.filter(id =>
        allModelsData.models.some(m => m.id === id)
      );
      setDisplayModelIds(new Set(validIds));
    }
  }, [defaultModelIds, allModelsData]);

  // 保存默认模型配置
  const saveDefaultModels = useCallback((modelIds: string[]) => {
    setDefaultModelIds(modelIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modelIds));
    setDisplayModelIds(new Set(modelIds));
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
              className="admin-btn"
              onClick={() => setShowAdmin(true)}
            >
              ⚙️ 管理默认列表
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
            <p>点击上方"添加模型对比"按钮，或在"管理默认列表"中设置默认模型</p>
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

      {/* Admin 面板 */}
      {showAdmin && allModelsData && (
        <Admin
          onClose={() => setShowAdmin(false)}
          allModels={allModelsData.models}
          selectedModelIds={defaultModelIds}
          onSave={saveDefaultModels}
        />
      )}
    </div>
  );
}

export default App;
