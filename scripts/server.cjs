#!/usr/bin/env node

/**
 * 简单的静态文件服务器
 * 用于托管构建后的前端应用
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4180;
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

    // 安全检查：防止目录遍历攻击
    if (!filePath.startsWith(DIST_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // SPA 回退：返回 index.html
            filePath = path.join(DIST_DIR, 'index.html');
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }

            const mimeType = getMimeType(filePath);
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Cache-Control': filePath.includes('/assets/')
                    ? 'max-age=31536000, immutable'
                    : 'no-cache',
            });
            res.end(data);
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 静态文件服务器已启动: http://0.0.0.0:${PORT}`);
    console.log(`[${new Date().toISOString()}] 服务目录: ${DIST_DIR}`);
});
