#!/usr/bin/env node

/**
 * OpenRouter 模型数据同步脚本
 * 每小时从 OpenRouter API 获取最新模型信息并保存到 JSON 文件
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://openrouter.ai/api/v1/models';
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'models.json');

/**
 * 格式化价格为每百万 token 的美元价格
 */
function formatPrice(pricePerToken) {
    const price = parseFloat(pricePerToken) || 0;
    return Math.round(price * 1000000 * 1000) / 1000; // 保留3位小数
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
    if (parts.length >= 2) {
        return parts[0];
    }
    return 'unknown';
}

/**
 * 从 OpenRouter API 获取模型数据
 */
async function fetchModels() {
    console.log(`[${new Date().toISOString()}] 开始从 OpenRouter API 获取模型数据...`);

    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
        throw new Error('API 返回数据格式错误');
    }

    console.log(`[${new Date().toISOString()}] 获取到 ${data.data.length} 个模型`);

    return data.data;
}

/**
 * 处理并格式化模型数据
 */
function processModels(rawModels) {
    return rawModels.map(model => ({
        id: model.id,
        name: model.name || model.id,
        provider: extractProvider(model.id),
        description: model.description || '',

        // 上下文信息
        contextLength: model.context_length || 0,
        contextLengthFormatted: formatContextLength(model.context_length),
        maxOutput: model.top_provider?.max_completion_tokens || 0,
        maxOutputFormatted: formatContextLength(model.top_provider?.max_completion_tokens),

        // 价格信息 (每百万 token 的美元价格)
        inputPrice: formatPrice(model.pricing?.prompt),
        outputPrice: formatPrice(model.pricing?.completion),

        // 模态信息
        modality: model.architecture?.modality || 'text->text',
        inputModalities: model.architecture?.input_modalities || ['text'],
        outputModalities: model.architecture?.output_modalities || ['text'],

        // OpenRouter 页面链接
        openRouterUrl: `https://openrouter.ai/${model.id}`,

        // 元信息
        createdAt: model.created ? new Date(model.created * 1000).toISOString() : null
    }));
}

/**
 * 保存数据到 JSON 文件
 */
function saveData(models) {
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const data = {
        updatedAt: new Date().toISOString(),
        totalCount: models.length,
        models: models
    };

    const jsonContent = JSON.stringify(data, null, 2);

    // 保存到 data 目录
    fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');

    // 同时复制到 public/data 目录供前端访问
    const PUBLIC_DATA_DIR = path.join(__dirname, '..', 'public', 'data');
    const PUBLIC_OUTPUT_FILE = path.join(PUBLIC_DATA_DIR, 'models.json');

    if (!fs.existsSync(PUBLIC_DATA_DIR)) {
        fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PUBLIC_OUTPUT_FILE, jsonContent, 'utf-8');

    console.log(`[${new Date().toISOString()}] 数据已保存到 ${OUTPUT_FILE}`);
    console.log(`[${new Date().toISOString()}] 数据已同步到 ${PUBLIC_OUTPUT_FILE}`);
    console.log(`[${new Date().toISOString()}] 共 ${models.length} 个模型`);
}

/**
 * 主函数
 */
async function main() {
    try {
        const rawModels = await fetchModels();
        const processedModels = processModels(rawModels);
        saveData(processedModels);
        console.log(`[${new Date().toISOString()}] 同步完成!`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 同步失败:`, error.message);
        process.exit(1);
    }
}

main();
