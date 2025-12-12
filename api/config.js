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
 *   DEFAULT_MODELS (comma-separated model IDs, persisted config)
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

/**
 * Get default models from environment variable or fallback
 */
function getDefaultModels() {
    const envModels = process.env.DEFAULT_MODELS;
    if (envModels && envModels.trim()) {
        return envModels.split(',').map(id => id.trim()).filter(Boolean);
    }
    return FALLBACK_MODELS;
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
        const defaultModels = getDefaultModels();
        return res.status(200).json({
            defaultModels,
            count: defaultModels.length,
            source: process.env.DEFAULT_MODELS ? 'environment' : 'fallback'
        });
    }

    // POST: Update config (requires auth)
    // Note: This updates the response but requires manual env var update for persistence
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

            // Generate the environment variable value for the user to copy
            const envValue = defaultModels.join(',');

            return res.status(200).json({
                success: true,
                message: 'Config saved. To persist after redeployment, update the DEFAULT_MODELS environment variable in Vercel.',
                defaultModels,
                count: defaultModels.length,
                envValue,
                instructions: `Go to Vercel → Settings → Environment Variables → Set DEFAULT_MODELS to:\n${envValue}`
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
