/**
 * Cloud-based AI Service
 * Uses OpenAI API directly with settings from Supabase
 */
import { cloudSettings, cloudAIConfigs } from '../hooks/supabaseStorage';
import type { AnalysisResult, PraiseResult, AIConfig } from '../types';

// Get AI config from cloud (Prioritize new ai_configs table)
async function getAIConfig(): Promise<{ apiKey: string; baseUrl: string; model: string, configId?: string }> {
    // 1. Try get active config from new table
    const activeConfig = await cloudAIConfigs.getActive();
    if (activeConfig) {
        return {
            apiKey: activeConfig.api_key,
            baseUrl: activeConfig.base_url,
            model: activeConfig.model_name,
            configId: activeConfig.id
        };
    }

    // 2. Fallback to legacy settings
    const config = await cloudSettings.fetchAll();
    return {
        apiKey: config.openai_api_key || '',
        baseUrl: config.openai_base_url || 'https://api.openai.com/v1',
        model: config.model_name || 'gpt-3.5-turbo'
    };
}

// 尝试切换到下一个可用配置
async function switchToNextConfig(currentConfigId?: string): Promise<boolean> {
    if (!currentConfigId) return false;

    const allConfigs = await cloudAIConfigs.fetchAll();
    if (allConfigs.length <= 1) return false;

    // 找到当前配置的索引
    const currentIndex = allConfigs.findIndex(c => c.id === currentConfigId);
    let nextIndex = (currentIndex + 1) % allConfigs.length;

    // 简单轮询：找下一个
    const nextConfig = allConfigs[nextIndex];
    if (nextConfig && nextConfig.id !== currentConfigId) {
        console.log(`[AI] Auto-switching to config: ${nextConfig.name}`);
        await cloudAIConfigs.setActive(nextConfig.id);
        return true;
    }
    return false;
}

// Generic chat completion call with retry
async function chatCompletion(systemPrompt: string, userMessage: string, retryCount = 0): Promise<string> {
    const { apiKey, baseUrl, model, configId } = await getAIConfig();

    console.log(`[AI] Calling ${baseUrl} with model ${model} (Attempt ${retryCount + 1})`);

    if (!apiKey) {
        throw new Error('请先在设置中配置 OpenAI API Key');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Check for 429 Rate Limit
            if (response.status === 429 && retryCount < 3) {
                console.warn(`[AI] Rate limit exceeded (429). Trying next config...`);
                const switched = await switchToNextConfig(configId);
                if (switched) {
                    return chatCompletion(systemPrompt, userMessage, retryCount + 1);
                }
            }

            const errorText = await response.text();
            console.error('[AI] API Error:', response.status, errorText);

            let friendlyMessage = `AI 服务请求失败 (${response.status})`;
            if (response.status === 401) {
                friendlyMessage = 'API Key 无效或过期，请在设置中检查';
            } else if (response.status === 429) {
                friendlyMessage = '当前配置请求次数超限，且无其他可用配置';
            } else if (response.status >= 500) {
                friendlyMessage = 'AI 服务器开小差了，请稍后重试';
            }

            try {
                const errorJson = JSON.parse(errorText) as import('../types').AIErrorResponse;
                const backendMsg = errorJson.error && typeof errorJson.error !== 'string'
                    ? errorJson.error.message
                    : (typeof errorJson.error === 'string' ? errorJson.error : '');

                throw new Error(backendMsg || friendlyMessage);
            } catch (e: unknown) {
                // If it's already the Error we threw above, rethrow it
                if (e instanceof Error && e.message !== friendlyMessage && !e.message.includes('JSON')) {
                    throw e;
                }
                throw new Error(`${friendlyMessage}: ${errorText.substring(0, 50)}...`);
            }
        }

        const data = await response.json() as import('../types').AIChatCompletionResponse;
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.warn('[AI] Empty response content:', data);

            // Check for provider specific errors (e.g. iflow.cn / siliconflow)
            const statusStr = String(data.status || '');
            if ((data.status && data.msg) || statusStr === '435') {
                const msg = data.msg || (data.error ? JSON.stringify(data.error) : 'Unknown Error');
                const isModelError = msg.includes('Model not support') || statusStr === '435';

                if (isModelError) {
                    console.warn(`[AI] Model error detected (${msg}). Trying next config...`);
                    const switched = await switchToNextConfig(configId);
                    if (switched) {
                        return chatCompletion(systemPrompt, userMessage, retryCount + 1);
                    }
                    throw new Error(`AI 服务商报错: ${msg} (请检查模型名称是否正确)`);
                }
                throw new Error(`AI 服务商报错: ${msg}`);
            }

            // Check generic 'error' field in 200 OK response
            if (data.error) {
                const errorMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                throw new Error(`AI API 报错: ${errorMsg}`);
            }

            throw new Error('AI 返回了空内容，且无明确错误信息');
        }

        return content;

    } catch (error: unknown) {
        clearTimeout(timeoutId);
        console.error('[AI] Request Failed:', error);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('AI 请求超时 (60秒)，请检查网络或稍后重试');
            }
            if (error.message === 'Failed to fetch') {
                throw new Error('无法连接到 AI 服务器，请检查网络或 Base URL 设置');
            }
            throw error;
        }
        throw new Error(String(error));
    }
}

// Helper to clean markdown formatting from JSON string
function cleanJsonResponse(str: string): string {
    if (!str) return '{}';
    // Remove markdown code blocks: ```json, ``` json, ````json, etc. (any backticks, optional space, optional language tag)
    let cleaned = str.replace(/`{3,}\s*json\s*/gi, '').replace(/\s*`{3,}/g, '');
    // Sometimes there's explanation text before/after, try to find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned.trim();
}

// Behavior analysis for BehaviorWizard
export const analyzeBehavior = async (
    behavior: string,
    motivation: number,
    ability: number
): Promise<AnalysisResult> => {
    const systemPrompt = `你是一位专业的行为设计顾问，基于福格行为模型帮助用户建立微习惯。
    
请分析用户想要建立的行为，并提供：
1. 分析这个行为目前的可行性
2. 建议一个更微小、更容易执行的版本
3. 设计一个"锚点+微行为"的配方

以纯JSON格式回复（不要Markdown格式）：
{
  "analysis": "对行为的简短分析",
  "suggestion": "如何让这个行为更容易执行的建议（markdown格式）",
  "recipe": {
    "anchor": "触发行为的锚点，如'当我刷完牙后'",
    "tiny_behavior": "极简版本的行为，如'做2个深蹲'"
  },
  "environment_setup": ["为成功准备环境的建议1", "建议2"]
}`;

    const userMessage = `行为: ${behavior}\n动机分数: ${motivation}/10\n能力分数: ${ability}/10`;

    let response = '';
    try {
        response = await chatCompletion(systemPrompt, userMessage);
        const cleaned = cleanJsonResponse(response);
        console.log('[AI] Raw Response:', response);
        console.log('[AI] Cleaned Response:', cleaned);

        const parsed = JSON.parse(cleaned);
        return {
            behavior,
            score: Math.min(motivation, ability),
            suggestion: parsed.suggestion || '',
            analysis: parsed.analysis,
            recipe: parsed.recipe,
            environment_setup: parsed.environment_setup
        };
    } catch (e: any) {
        console.error('[AI] Parse Error:', e);

        // Fallback for JSON parse errors
        if (e.message?.includes('JSON')) {
            return {
                behavior,
                score: Math.min(motivation, ability),
                suggestion: `AI 返回格式可能有误，无法解析为 JSON。\n\n原始回复:\n${response}`,
                analysis: '解析错误'
            };
        }
        throw e;
    }
};

// Diagnosis for DiagnosisModal
export const diagnoseFailure = async (habit: any, reason: string): Promise<any> => {
    const systemPrompt = `你是一位行为习惯医生，专门帮助用户诊断为什么习惯没有执行成功，并提供修复方案。

根据用户提供的习惯信息和失败原因，给出：
1. 诊断结果
2. 一个更简单/更适合的新方案

以纯JSON格式回复（不要Markdown格式）：
{
  "diagnosis": "对失败原因的简短诊断",
  "new_plan": {
    "anchor": "新的锚点",
    "tiny_behavior": "更简单的微行为"
  }
}`;

    const reasonMap: Record<string, string> = {
        'forgot': '我忘记做了',
        'hard': '太难了/太累了',
        'unmotivated': '觉得没意义',
        'ineffective': '做了但没用'
    };

    const userMessage = `习惯信息：
- 锚点: ${habit.anchor}
- 微行为: ${habit.tiny_behavior}
- 原始目标: ${habit.original_behavior || '(未知)'}

失败原因: ${reasonMap[reason] || reason}`;

    let response = '';
    try {
        response = await chatCompletion(systemPrompt, userMessage);
        const cleaned = cleanJsonResponse(response);
        console.log('[AI] Diagnose Raw Response:', response);
        console.log('[AI] Diagnose Cleaned Response:', cleaned);
        return JSON.parse(cleaned);
    } catch (e: any) {
        console.error('[AI] Diagnose Error:', e);

        // Fallback for JSON parse errors
        if (e.message?.includes('JSON') || e.message?.includes('Unexpected')) {
            return {
                diagnosis: `AI返回格式异常，请重试。原始回复: ${response.substring(0, 100)}...`,
                new_plan: null
            };
        }
        throw e;
    }
};

// Praise for celebrations
export const getPraise = async (behavior: string): Promise<PraiseResult> => {
    try {
        const systemPrompt = '你是一位热情的啦啦队长。用一句话和一个emoji庆祝用户完成了习惯。回复JSON格式: {"message": "庆祝语", "emoji": "🎉"}';
        const response = await chatCompletion(systemPrompt, `用户完成了: ${behavior}`);
        return JSON.parse(response);
    } catch {
        return { message: '你真棒！继续加油！', emoji: '👍' };
    }
};
