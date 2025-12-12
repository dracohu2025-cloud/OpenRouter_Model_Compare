import type { Model, SortField, SortDirection } from '../types';
import './ModelTable.css';

interface ModelTableProps {
    models: Model[];
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onRemove?: (modelId: string) => void;
    showRemoveButton?: boolean;
}

function ModelTable({
    models,
    sortField,
    sortDirection,
    onSort,
    onRemove,
    showRemoveButton = false
}: ModelTableProps) {
    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <span className="sort-icon">↕</span>;
        }
        return <span className="sort-icon active">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const formatPrice = (price: number): string => {
        if (price <= 0) return 'Free';
        if (price < 0.01) return `$${price.toFixed(4)}`;
        if (price < 1) return `$${price.toFixed(3)}`;
        return `$${price.toFixed(2)}`;
    };

    const getProviderBadgeClass = (provider: string): string => {
        const providerMap: Record<string, string> = {
            'openai': 'badge-openai',
            'anthropic': 'badge-anthropic',
            'google': 'badge-google',
            'meta-llama': 'badge-meta',
            'mistralai': 'badge-mistral',
            'deepseek': 'badge-deepseek',
            'amazon': 'badge-amazon',
            'x-ai': 'badge-xai',
        };
        return providerMap[provider] || 'badge-default';
    };

    if (models.length === 0) {
        return null; // 让父组件处理空状态
    }

    return (
        <div className="table-container">
            <table className="model-table">
                <thead>
                    <tr>
                        <th className="th-name" onClick={() => onSort('name')}>
                            Model {renderSortIcon('name')}
                        </th>
                        <th className="th-provider" onClick={() => onSort('provider')}>
                            Provider {renderSortIcon('provider')}
                        </th>
                        <th className="th-context" onClick={() => onSort('contextLength')}>
                            Context {renderSortIcon('contextLength')}
                        </th>
                        <th className="th-output" onClick={() => onSort('maxOutput')}>
                            Max Output {renderSortIcon('maxOutput')}
                        </th>
                        <th className="th-input-price" onClick={() => onSort('inputPrice')}>
                            Input Price {renderSortIcon('inputPrice')}
                        </th>
                        <th className="th-output-price" onClick={() => onSort('outputPrice')}>
                            Output Price {renderSortIcon('outputPrice')}
                        </th>
                        <th className="th-modality">Modality</th>
                        <th className="th-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((model) => (
                        <tr key={model.id}>
                            <td className="td-name">
                                <div className="model-name-wrapper">
                                    <span className="model-name">{model.name}</span>
                                    <span className="model-id">{model.id}</span>
                                </div>
                            </td>
                            <td className="td-provider">
                                <span className={`provider-badge ${getProviderBadgeClass(model.provider)}`}>
                                    {model.provider}
                                </span>
                            </td>
                            <td className="td-context">
                                <span className="context-value">
                                    {model.contextLengthFormatted || '-'}
                                </span>
                            </td>
                            <td className="td-output">
                                <span className="output-value">
                                    {model.maxOutputFormatted || '-'}
                                </span>
                            </td>
                            <td className="td-input-price">
                                <span className={model.inputPrice === 0 ? 'price-free' : 'price-value'}>
                                    {formatPrice(model.inputPrice)}
                                </span>
                            </td>
                            <td className="td-output-price">
                                <span className={model.outputPrice === 0 ? 'price-free' : 'price-value'}>
                                    {formatPrice(model.outputPrice)}
                                </span>
                            </td>
                            <td className="td-modality">
                                <span className="modality-badge" title={`Input: ${model.inputModalities?.join(', ') || 'text'}\nOutput: ${model.outputModalities?.join(', ') || 'text'}`}>
                                    {model.modality.includes('image') ? '🖼️' : ''}
                                    {model.modality.includes('audio') ? '🎵' : ''}
                                    {model.modality.includes('video') ? '🎬' : ''}
                                    {model.modality === 'text->text' ? '📝' : ''}
                                    {!model.modality.includes('image') &&
                                        !model.modality.includes('audio') &&
                                        !model.modality.includes('video') &&
                                        model.modality !== 'text->text' ? '📝' : ''}
                                </span>
                            </td>
                            <td className="td-actions">
                                <div className="action-buttons">
                                    <a
                                        href={model.openRouterUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="action-link"
                                    >
                                        View ↗
                                    </a>
                                    {showRemoveButton && onRemove && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => onRemove(model.id)}
                                            title="Remove from comparison"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ModelTable;
