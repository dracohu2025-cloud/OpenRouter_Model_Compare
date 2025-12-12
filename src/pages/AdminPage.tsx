import { useState, useEffect, useMemo } from 'react';
import type { Model, ModelsData } from '../types';
import './AdminPage.css';

function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const [allModels, setAllModels] = useState<Model[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [providerFilter, setProviderFilter] = useState('all');

    // 加载所有模型数据
    useEffect(() => {
        const loadData = async () => {
            try {
                // 获取所有模型
                const modelsRes = await fetch('/api/models');
                const modelsData: ModelsData = await modelsRes.json();
                setAllModels(modelsData.models);

                // 获取当前配置
                const configRes = await fetch('/api/config');
                const configData = await configRes.json();
                setSelectedIds(new Set(configData.defaultModels || []));

                setLoading(false);
            } catch (err) {
                console.error('Failed to load data:', err);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // 登录
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        try {
            const credentials = btoa(`${username}:${password}`);
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({ defaultModels: Array.from(selectedIds) })
            });

            if (res.ok) {
                setIsAuthenticated(true);
                // 保存凭证到 sessionStorage
                sessionStorage.setItem('adminAuth', credentials);
            } else {
                const data = await res.json();
                setAuthError(data.message || '登录失败');
            }
        } catch (err) {
            setAuthError('网络错误');
        }
    };

    // 检查已保存的认证
    useEffect(() => {
        const savedAuth = sessionStorage.getItem('adminAuth');
        if (savedAuth) {
            setIsAuthenticated(true);
        }
    }, []);

    // 保存配置
    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');

        const auth = sessionStorage.getItem('adminAuth');
        if (!auth) {
            setIsAuthenticated(false);
            return;
        }

        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({ defaultModels: Array.from(selectedIds) })
            });

            if (res.ok) {
                setSaveMessage('✅ 配置已保存！所有用户现在将看到新的默认模型列表。');
            } else {
                if (res.status === 401) {
                    setIsAuthenticated(false);
                    sessionStorage.removeItem('adminAuth');
                }
                const data = await res.json();
                setSaveMessage(`❌ 保存失败: ${data.message}`);
            }
        } catch (err) {
            setSaveMessage('❌ 网络错误');
        }

        setSaving(false);
    };

    // 登出
    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth');
        setUsername('');
        setPassword('');
    };

    // 厂商列表
    const providers = useMemo(() => {
        const set = new Set(allModels.map(m => m.provider));
        return Array.from(set).sort();
    }, [allModels]);

    // 过滤后的模型
    const filteredModels = useMemo(() => {
        let models = [...allModels];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            models = models.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q)
            );
        }

        if (providerFilter !== 'all') {
            models = models.filter(m => m.provider === providerFilter);
        }

        return models;
    }, [allModels, searchQuery, providerFilter]);

    // 切换选择
    const toggleModel = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 全选/取消
    const toggleAll = () => {
        if (filteredModels.every(m => selectedIds.has(m.id))) {
            setSelectedIds(prev => {
                const newSet = new Set(prev);
                filteredModels.forEach(m => newSet.delete(m.id));
                return newSet;
            });
        } else {
            setSelectedIds(prev => {
                const newSet = new Set(prev);
                filteredModels.forEach(m => newSet.add(m.id));
                return newSet;
            });
        }
    };

    // 清空
    const clearAll = () => setSelectedIds(new Set());

    // 登录页面
    if (!isAuthenticated) {
        return (
            <div className="admin-login-page">
                <div className="login-card">
                    <h1>🔐 管理员登录</h1>
                    <p>请输入管理员账号密码来管理默认模型列表</p>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>用户名</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>密码</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="输入管理员密码"
                                required
                            />
                        </div>

                        {authError && <div className="error-message">{authError}</div>}

                        <button type="submit" className="login-btn">
                            登录
                        </button>
                    </form>

                    <a href="/" className="back-link">← 返回首页</a>
                </div>
            </div>
        );
    }

    // 管理页面
    return (
        <div className="admin-page">
            <header className="admin-header">
                <div className="admin-header-left">
                    <h1>⚙️ 管理后台</h1>
                    <p>配置所有用户默认看到的模型列表</p>
                </div>
                <div className="admin-header-right">
                    <a href="/" className="nav-link">← 返回首页</a>
                    <button onClick={handleLogout} className="logout-btn">退出登录</button>
                </div>
            </header>

            <main className="admin-main">
                {loading ? (
                    <div className="loading">加载中...</div>
                ) : (
                    <>
                        <div className="admin-toolbar">
                            <input
                                type="text"
                                placeholder="搜索模型名称或 ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />

                            <select
                                value={providerFilter}
                                onChange={(e) => setProviderFilter(e.target.value)}
                                className="provider-select"
                            >
                                <option value="all">全部厂商 ({providers.length})</option>
                                {providers.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <button onClick={toggleAll} className="action-btn">
                                {filteredModels.every(m => selectedIds.has(m.id)) ? '取消全选' : '全选'}
                            </button>

                            <button onClick={clearAll} className="action-btn danger">
                                清空选择
                            </button>

                            <div className="selected-info">
                                已选 <strong>{selectedIds.size}</strong> 个模型
                            </div>
                        </div>

                        <div className="model-grid">
                            {filteredModels.map(model => (
                                <div
                                    key={model.id}
                                    className={`model-card ${selectedIds.has(model.id) ? 'selected' : ''}`}
                                    onClick={() => toggleModel(model.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(model.id)}
                                        onChange={() => { }}
                                    />
                                    <div className="model-card-content">
                                        <div className="model-card-name">{model.name}</div>
                                        <div className="model-card-id">{model.id}</div>
                                        <div className="model-card-meta">
                                            <span className="provider-tag">{model.provider}</span>
                                            <span className="price-tag">
                                                ${model.inputPrice}/${model.outputPrice}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="save-bar">
                            {saveMessage && <div className="save-message">{saveMessage}</div>}
                            <button
                                onClick={handleSave}
                                className="save-btn"
                                disabled={saving}
                            >
                                {saving ? '保存中...' : '💾 保存配置'}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default AdminPage;
