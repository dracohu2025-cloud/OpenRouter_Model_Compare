module.exports = {
    apps: [
        {
            name: 'openrouter-compare',
            script: 'scripts/server.cjs',
            cwd: '/home/ubuntu/OpenRouter_Model_Compare/OpenRouter_Model_Compare',
            env: {
                NODE_ENV: 'production',
                PORT: 4180
            },
            interpreter: 'node',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M'
        },
        {
            name: 'openrouter-sync',
            script: 'scripts/sync-models.cjs',
            cwd: '/home/ubuntu/OpenRouter_Model_Compare/OpenRouter_Model_Compare',
            cron_restart: '0 * * * *', // 每小时整点执行
            autorestart: false, // 执行完成后不自动重启
            watch: false,
            interpreter: 'node'
        }
    ]
};
