/**
 * Vercel Serverless Function: 获取 OpenRouter 模型数据
 * 每次请求时从 OpenRouter API 获取最新数据（带缓存）
 */

const OPENROUTER_API = 'https://openrouter.ai/api/v1/models';

// 内存缓存
let cache = {
    data: null,
    timestamp: 0,
    TTL: 60 * 60 * 1000 // 1小时缓存
};

/**
 * 格式化价格为每百万 token 的美元价格
 */
function formatPrice(pricePerToken) {
    const price = parseFloat(pricePerToken) || 0;
    return Math.round(price * 1000000 * 1000) / 1000;
}

/**
 * 格式化上下文长度为可读格式
 */
function formatContextLength(length) {
    if (!length) return null;
    if (length >= 1000000) {
        return `${(length / 1000000).toFixed(2)}M`;
    }
    if (length >= 1000) {
        return `${(length / 1000).toFixed(0)}K`;
    }
    return String(length);
}

/**
 * 从模型 ID 提取厂商名称
 */
function extractProvider(modelId) {
    const parts = modelId.split('/');
    return parts.length >= 2 ? parts[0] : 'unknown';
}

/**
 * 处理模型数据
 */
function processModels(rawModels) {
    return rawModels.map(model => ({
        id: model.id,
        name: model.name || model.id,
        provider: extractProvider(model.id),
        description: model.description || '',
        contextLength: model.context_length || 0,
        contextLengthFormatted: formatContextLength(model.context_length),
        maxOutput: model.top_provider?.max_completion_tokens || 0,
        maxOutputFormatted: formatContextLength(model.top_provider?.max_completion_tokens),
        inputPrice: formatPrice(model.pricing?.prompt),
        outputPrice: formatPrice(model.pricing?.completion),
        modality: model.architecture?.modality || 'text->text',
        inputModalities: model.architecture?.input_modalities || ['text'],
        outputModalities: model.architecture?.output_modalities || ['text'],
        openRouterUrl: `https://openrouter.ai/${model.id}`,
        createdAt: model.created ? new Date(model.created * 1000).toISOString() : null
    }));
}

export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    // 检查缓存是否有效
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < cache.TTL) {
        return res.status(200).json({
            ...cache.data,
            fromCache: true
        });
    }

    try {
        const response = await fetch(OPENROUTER_API);

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid API response format');
        }

        const models = processModels(data.data);

        const result = {
            updatedAt: new Date().toISOString(),
            totalCount: models.length,
            models: models
        };

        // 更新缓存
        cache = {
            data: result,
            timestamp: now,
            TTL: cache.TTL
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error('API Error:', error);

        // 如果有缓存数据（即使过期），返回缓存
        if (cache.data) {
            return res.status(200).json({
                ...cache.data,
                fromCache: true,
                cacheReason: 'API error fallback'
            });
        }

        return res.status(500).json({
            error: 'Failed to fetch models',
            message: error.message
        });
    }
}
