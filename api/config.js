/**
 * Admin API: 获取和更新默认模型配置
 * 
 * GET - 获取当前配置（公开）
 * POST - 更新配置（需要认证）
 * 
 * 认证方式: Basic Auth 或 Bearer Token
 * 管理员账号密码通过环境变量配置:
 *   ADMIN_USERNAME (默认: admin)
 *   ADMIN_PASSWORD (必须配置)
 */

// 默认模型列表（当没有配置时使用）
const DEFAULT_MODELS = [
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

// 简单的内存存储（生产环境应使用 KV Storage）
// 注意：Serverless 函数重启后会重置
let configStore = {
    defaultModels: DEFAULT_MODELS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
};

/**
 * 验证管理员认证
 */
function verifyAuth(req) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        console.error('ADMIN_PASSWORD environment variable not set');
        return { valid: false, error: 'Server configuration error' };
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
        return { valid: false, error: 'No authorization header' };
    }

    // 支持 Basic Auth
    if (authHeader.startsWith('Basic ')) {
        const base64 = authHeader.slice(6);
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':');

        if (username === adminUsername && password === adminPassword) {
            return { valid: true, username };
        }
    }

    // 支持 Bearer Token (简单密码验证)
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token === adminPassword) {
            return { valid: true, username: adminUsername };
        }
    }

    return { valid: false, error: 'Invalid credentials' };
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET: 获取当前配置（公开）
    if (req.method === 'GET') {
        return res.status(200).json({
            defaultModels: configStore.defaultModels,
            updatedAt: configStore.updatedAt,
            count: configStore.defaultModels.length
        });
    }

    // POST: 更新配置（需要认证）
    if (req.method === 'POST') {
        const auth = verifyAuth(req);

        if (!auth.valid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: auth.error
            });
        }

        try {
            const { defaultModels } = req.body;

            if (!Array.isArray(defaultModels)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'defaultModels must be an array'
                });
            }

            // 更新配置
            configStore = {
                defaultModels,
                updatedAt: new Date().toISOString(),
                updatedBy: auth.username
            };

            return res.status(200).json({
                success: true,
                message: 'Configuration updated',
                ...configStore
            });

        } catch (error) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
