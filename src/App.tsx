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
        <p>Loading model data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error-container">
        <h2>Failed to load</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title-row">
            <h1>OpenRouter Model Comparison</h1>
            <a
              href="https://github.com/dracohu2025-cloud/OpenRouter_Model_Compare"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
              title="View on GitHub"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
          <p className="subtitle">
            Compare pricing and context length of top LLMs
          </p>
          {allModelsData && (
            <p className="update-time">
              Updated: {new Date(allModelsData.updatedAt).toLocaleString('en-US')}
              {' · '}
              Available: {allModelsData.totalCount} models
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
              Comparing {displayedModels.length} models
            </span>
            <button
              className="reset-btn"
              onClick={resetToDefault}
              title="Reset to default list"
            >
              🔄 Reset
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
            <p>😅 No models selected</p>
            <p>Click "Add Model" above to add models</p>
          </div>
        )}
      </main>

      {/* Ad Placeholder - Hidden by default, enable in CSS when ready */}
      <div className="ad-container" aria-hidden="true">
        <div className="ad-slot" id="ad-slot-bottom">
          {/* Google AdSense code will go here */}
        </div>
      </div>

      <footer className="footer">
        <p>
          Data: <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">OpenRouter API</a>
          {' | '}
          Prices: USD per million tokens
        </p>
      </footer>
    </div>
  );
}

export default App;
