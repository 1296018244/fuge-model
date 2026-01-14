/**
 * Supabase Storage Layer
 * Provides CRUD operations for habits and aspirations in Supabase
 */
import { supabase, HABITS_TABLE, ASPIRATIONS_TABLE } from '../lib/supabase';
import type { HabitRecipe } from '../types';



// 习惯 CRUD 操作
export const cloudHabits = {
    async fetchAll(): Promise<HabitRecipe[]> {
        const { data, error } = await supabase
            .from(HABITS_TABLE)
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('获取习惯失败:', error);
            return [];
        }

        // 转换为前端格式
        return (data || []).map(h => ({
            id: h.id,
            anchor: h.anchor,
            tiny_behavior: h.tiny_behavior,
            original_behavior: h.original_behavior || '',
            motivation: h.motivation || 5,
            ability: h.ability || 5,
            ai_suggestion: h.ai_suggestion || '',
            environment_setup: h.environment_setup,
            aspiration: h.aspiration || '未分类',
            difficulty_level: h.difficulty_level || 1,
            evolution_log: h.evolution_log || [],
            created_at: h.created_at,
            completed_count: h.completed_count || 0,
            last_completed: h.last_completed,
            history: h.history || [],
            celebration_method: h.celebration_method || '握拳说"Yes!"',
            backup_time: h.backup_time,
            habit_type: h.habit_type || 'regular',
            paused: h.paused || false,
            current_streak: h.current_streak || 0,
            consecutive_failures: h.consecutive_failures || 0,
            scaled_versions: h.scaled_versions || [],
            next_habit_id: h.next_habit_id,
        }));
    },

    async upsert(habit: HabitRecipe): Promise<boolean> {
        const { error } = await supabase
            .from(HABITS_TABLE)
            .upsert({
                id: habit.id,
                anchor: habit.anchor,
                tiny_behavior: habit.tiny_behavior,
                original_behavior: habit.original_behavior,
                motivation: habit.motivation,
                ability: habit.ability,
                ai_suggestion: habit.ai_suggestion,
                environment_setup: habit.environment_setup,
                aspiration: habit.aspiration,
                difficulty_level: habit.difficulty_level,
                evolution_log: habit.evolution_log,
                completed_count: habit.completed_count,
                last_completed: habit.last_completed,
                history: habit.history,
                celebration_method: habit.celebration_method,
                backup_time: habit.backup_time,
                habit_type: habit.habit_type,
                paused: habit.paused,
                current_streak: habit.current_streak,
                consecutive_failures: habit.consecutive_failures,
                scaled_versions: habit.scaled_versions,
                next_habit_id: habit.next_habit_id,
            }, { onConflict: 'id' });

        if (error) {
            console.error('保存习惯失败:', error);
            return false;
        }
        return true;
    },

    async upsertMany(habits: HabitRecipe[]): Promise<boolean> {
        if (habits.length === 0) return true;

        const { error } = await supabase
            .from(HABITS_TABLE)
            .upsert(habits.map(h => ({
                id: h.id,
                local_id: h.id, // 保存原始 ID 用于迁移追踪
                anchor: h.anchor,
                tiny_behavior: h.tiny_behavior,
                original_behavior: h.original_behavior,
                motivation: h.motivation,
                ability: h.ability,
                ai_suggestion: h.ai_suggestion,
                environment_setup: h.environment_setup,
                aspiration: h.aspiration,
                difficulty_level: h.difficulty_level,
                evolution_log: h.evolution_log,
                completed_count: h.completed_count,
                last_completed: h.last_completed,
                history: h.history,
                celebration_method: h.celebration_method,
                backup_time: h.backup_time,
                habit_type: h.habit_type,
                paused: h.paused,
                current_streak: h.current_streak,
                consecutive_failures: h.consecutive_failures,
                scaled_versions: h.scaled_versions,
                next_habit_id: h.next_habit_id,
            })), { onConflict: 'id' });

        if (error) {
            console.error('批量保存习惯失败:', error);
            return false;
        }
        return true;
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase
            .from(HABITS_TABLE)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('删除习惯失败:', error);
            return false;
        }
        return true;
    }
};

// 愿景 CRUD 操作
export const cloudAspirations = {
    async fetchAll(): Promise<string[]> {
        const { data, error } = await supabase
            .from(ASPIRATIONS_TABLE)
            .select('name')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('获取愿景失败:', error);
            return [];
        }

        return (data || []).map(a => a.name);
    },

    async add(name: string): Promise<boolean> {
        const { error } = await supabase
            .from(ASPIRATIONS_TABLE)
            .upsert({ name }, { onConflict: 'name' });

        if (error) {
            console.error('添加愿景失败:', error);
            return false;
        }
        return true;
    },

    async addMany(names: string[]): Promise<boolean> {
        if (names.length === 0) return true;

        const { error } = await supabase
            .from(ASPIRATIONS_TABLE)
            .upsert(names.map(name => ({ name })), { onConflict: 'name' });

        if (error) {
            console.error('批量添加愿景失败:', error);
            return false;
        }
        return true;
    }
};

// 全局配置 CRUD 操作
export const cloudSettings = {
    async fetchAll(): Promise<Record<string, string>> {
        const { data, error } = await supabase
            .from('settings')
            .select('key, value');

        if (error) {
            console.error('获取配置失败:', error);
            return {};
        }

        const settings: Record<string, string> = {};
        data?.forEach(item => {
            // 允许空字符串，只排除 null/undefined
            if (item.value !== null && item.value !== undefined) {
                settings[item.key] = item.value;
            }
        });
        return settings;
    },

    async save(settings: Record<string, string>): Promise<boolean> {
        const upsertData = Object.entries(settings).map(([key, value]) => ({
            key,
            value,
            updated_at: new Date().toISOString()
        }));

        if (upsertData.length === 0) return true;

        try {
            const { error } = await supabase
                .from('settings')
                .upsert(upsertData, { onConflict: 'key' });

            if (error) {
                console.error('保存配置失败:', error);
                return false;
            }
            return true;
        } catch (e: any) {
            console.error('保存配置异常 (Exception):', e);
            alert('云端保存异常: ' + (e.message || String(e)));
            return false;
        }
    }
};



// 多 AI 配置 CRUD 操作
export const cloudAIConfigs = {
    async fetchAll(): Promise<import('../types').AIConfig[]> {
        let dbConfigs: import('../types').AIConfig[] = [];
        let dbError = null;

        // 1. Try Supabase
        try {
            const { data, error } = await supabase
                .from('ai_configs')
                .select('*')
                .order('priority', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            dbConfigs = data || [];
        } catch (e: any) {
            console.warn('云端配置获取失败 (可能表未创建), 尝试本地缓存:', e.message);
            dbError = e;
        }

        // 2. Try LocalStorage (Always read as backup/fallback)
        let localConfigs: import('../types').AIConfig[] = [];
        try {
            const cached = localStorage.getItem('fogg_ai_configs');
            if (cached) {
                localConfigs = JSON.parse(cached);
            }
        } catch (e) {
            console.warn('本地缓存读取失败:', e);
        }

        // 3. Merge / Fallback Logic
        // If DB failed (e.g. table missing), use LocalStorage
        if (dbError) {
            // Also try legacy settings if LocalStorage is empty
            if (localConfigs.length === 0) {
                const legacy = await cloudSettings.fetchAll();
                if (legacy.openai_api_key) {
                    return [{
                        id: 'legacy-migrated',
                        name: '旧配置 (自动迁移)',
                        api_key: legacy.openai_api_key,
                        base_url: legacy.openai_base_url || 'https://api.openai.com/v1',
                        model_name: legacy.model_name || 'gpt-3.5-turbo',
                        is_active: true,
                        priority: 0
                    }];
                }
            }
            return localConfigs;
        }

        // If DB worked, sync TO LocalStorage for offline resilience
        if (dbConfigs.length > 0) {
            localStorage.setItem('fogg_ai_configs', JSON.stringify(dbConfigs));
        }

        // Fallback checks for legacy in DB result
        if (dbConfigs.length === 0) {
            const legacy = await cloudSettings.fetchAll();
            if (legacy.openai_api_key) {
                return [{
                    id: 'legacy-migrated',
                    name: '旧配置 (自动迁移)',
                    api_key: legacy.openai_api_key,
                    base_url: legacy.openai_base_url || 'https://api.openai.com/v1',
                    model_name: legacy.model_name || 'gpt-3.5-turbo',
                    is_active: true,
                    priority: 0
                }];
            }
        }

        return dbConfigs;
    },

    async getActive(): Promise<import('../types').AIConfig | null> {
        const all = await this.fetchAll();
        return all.find(c => c.is_active) || null;
    },

    async upsert(config: Partial<import('../types').AIConfig>): Promise<boolean> {
        // 1. Prepare data
        const configToSave = { ...config };
        if (!configToSave.id) {
            configToSave.id = crypto.randomUUID();
        }

        // 2. Save to Supabase
        let dbSuccess = false;
        try {
            const { error } = await supabase
                .from('ai_configs')
                .upsert(configToSave, { onConflict: 'id' });

            if (error) throw error;
            dbSuccess = true;
        } catch (e) {
            console.error('保存 AI 配置到云端失败:', e);
        }

        // 3. Save to LocalStorage
        try {
            const all = await this.fetchAll();
            const index = all.findIndex(c => c.id === configToSave.id);

            // Handle Active state
            if (configToSave.is_active) {
                all.forEach(c => c.is_active = false);
            }

            const merged = {
                ...(index >= 0 ? all[index] : {}),
                ...configToSave
            } as import('../types').AIConfig;

            if (index >= 0) {
                all[index] = merged;
            } else {
                all.push(merged);
            }

            localStorage.setItem('fogg_ai_configs', JSON.stringify(all));
        } catch (e) {
            console.error('保存 AI 配置到本地失败:', e);
            if (!dbSuccess) return false;
        }

        return true;
    },

    async delete(id: string): Promise<boolean> {
        // 1. Delete from Supabase
        try {
            await supabase.from('ai_configs').delete().eq('id', id);
        } catch (e) {
            console.error('云端删除失败:', e);
        }

        // 2. Delete from LocalStorage
        try {
            const all = await this.fetchAll();
            const filtered = all.filter(c => c.id !== id);
            localStorage.setItem('fogg_ai_configs', JSON.stringify(filtered));
        } catch (e) {
            console.error('本地删除失败:', e);
        }

        return true;
    },

    async setActive(id: string): Promise<boolean> {
        // 1. Update Supabase
        try {
            await supabase
                .from('ai_configs')
                .update({ is_active: true })
                .eq('id', id);
        } catch (e) {
            console.error('云端激活失败:', e);
        }

        // 2. Update LocalStorage
        try {
            const all = await this.fetchAll();
            all.forEach(c => {
                c.is_active = (c.id === id);
            });
            localStorage.setItem('fogg_ai_configs', JSON.stringify(all));
        } catch (e) {
            console.error('本地激活失败:', e);
        }

        return true;
    }
};

// 获取云端数据统计
export const getCloudCounts = async (): Promise<{ habits: number; aspirations: number }> => {
    try {
        const { count: habitsCount, error: habitsError } = await supabase
            .from(HABITS_TABLE)
            .select('*', { count: 'exact', head: true });

        const { count: aspirationsCount, error: aspirationsError } = await supabase
            .from(ASPIRATIONS_TABLE)
            .select('*', { count: 'exact', head: true });

        if (habitsError || aspirationsError) {
            console.error('获取统计失败', habitsError, aspirationsError);
            return { habits: 0, aspirations: 0 };
        }

        return {
            habits: habitsCount || 0,
            aspirations: aspirationsCount || 0
        };
    } catch (e) {
        console.error('获取云端统计失败', e);
        return { habits: 0, aspirations: 0 };
    }
};
