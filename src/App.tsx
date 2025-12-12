import { useState, useEffect, useMemo } from 'react';
import type { ModelsData, SortField, SortDirection } from './types';
import ModelTable from './components/ModelTable';
import './App.css';

function App() {
  const [modelsData, setModelsData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('inputPrice');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // 加载数据
  useEffect(() => {
    // 优先从 API 获取（Vercel Serverless），回退到静态文件
    const fetchData = async () => {
      try {
        // 尝试从 API 获取
        let response = await fetch('/api/models');

        // 如果 API 不可用，回退到静态文件
        if (!response.ok) {
          console.log('API unavailable, falling back to static file');
          response = await fetch('/data/models.json');
        }

        if (!response.ok) throw new Error('数据加载失败');

        const data: ModelsData = await response.json();
        setModelsData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 获取所有厂商列表
  const providers = useMemo(() => {
    if (!modelsData) return [];
    const providerSet = new Set(modelsData.models.map(m => m.provider));
    return Array.from(providerSet).sort();
  }, [modelsData]);

  // 过滤和排序后的模型列表
  const filteredModels = useMemo(() => {
    if (!modelsData) return [];

    let models = [...modelsData.models];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query)
      );
    }

    // 厂商过滤
    if (selectedProvider !== 'all') {
      models = models.filter(m => m.provider === selectedProvider);
    }

    // 免费模型过滤
    if (showFreeOnly) {
      models = models.filter(m => m.inputPrice === 0 && m.outputPrice === 0);
    }

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
  }, [modelsData, searchQuery, selectedProvider, showFreeOnly, sortField, sortDirection]);

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
            实时对比 {modelsData?.totalCount} 个大模型的价格与性能
          </p>
          {modelsData && (
            <p className="update-time">
              数据更新时间: {new Date(modelsData.updatedAt).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* 筛选工具栏 */}
        <div className="filter-toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索模型名称、ID 或厂商..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>厂商</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="all">全部厂商 ({providers.length})</option>
              {providers.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
              />
              仅显示免费模型
            </label>
          </div>

          <div className="results-count">
            显示 {filteredModels.length} / {modelsData?.totalCount} 个模型
          </div>
        </div>

        {/* 模型表格 */}
        <ModelTable
          models={filteredModels}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
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
