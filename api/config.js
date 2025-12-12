/**
 * Admin API: Get and update default model configuration
 * 
 * GET - Get current config (public)
 * POST - Update config (requires auth)
 * 
 * Authentication: Basic Auth or Bearer Token
 * Environment variables:
 *   ADMIN_USERNAME (default: admin)
 *   ADMIN_PASSWORD (required)
 *   DEFAULT_MODELS (comma-separated model IDs, initial config)
 * 
 * Storage: Uses in-memory cache for runtime updates,
 *          falls back to environment variable on cold start.
 */

// Fallback model list (when no config is set)
const FALLBACK_MODELS = [
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

// Runtime cache - persists across requests within the same serverless instance
// Will reset on cold start, then reads from environment variable
let runtimeCache = null;

/**
 * Initialize or get cached config
 */
function getConfig() {
    // If we have a runtime cache, use it
    if (runtimeCache !== null) {
        return runtimeCache;
    }

    // Otherwise, initialize from environment variable or fallback
    const envModels = process.env.DEFAULT_MODELS;
    let models;

    if (envModels && envModels.trim()) {
        models = envModels.split(',').map(id => id.trim()).filter(Boolean);
    } else {
        models = FALLBACK_MODELS;
    }

    runtimeCache = {
        defaultModels: models,
        updatedAt: new Date().toISOString(),
        source: envModels ? 'environment' : 'fallback'
    };

    return runtimeCache;
}

/**
 * Update runtime cache
 */
function updateConfig(models, username) {
    runtimeCache = {
        defaultModels: models,
        updatedAt: new Date().toISOString(),
        updatedBy: username,
        source: 'admin'
    };
    return runtimeCache;
}

/**
 * Verify admin authentication
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

    // Support Basic Auth
    if (authHeader.startsWith('Basic ')) {
        const base64 = authHeader.slice(6);
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':');

        if (username === adminUsername && password === adminPassword) {
            return { valid: true, username };
        }
    }

    // Support Bearer Token
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

    // GET: Get current config (public)
    if (req.method === 'GET') {
        const config = getConfig();
        return res.status(200).json({
            defaultModels: config.defaultModels,
            count: config.defaultModels.length,
            source: config.source,
            updatedAt: config.updatedAt
        });
    }

    // POST: Update config (requires auth)
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

            // Update runtime cache - takes effect immediately
            const config = updateConfig(defaultModels, auth.username);

            // Generate environment variable value for persistence
            const envValue = defaultModels.join(',');

            return res.status(200).json({
                success: true,
                message: 'Config updated successfully! Changes are now active.',
                defaultModels: config.defaultModels,
                count: config.defaultModels.length,
                updatedAt: config.updatedAt,
                envValue,
                persistenceNote: 'To persist after redeployment, set DEFAULT_MODELS environment variable in Vercel to the envValue above.'
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
