import { useState, useEffect, useCallback } from 'react';
import { cloudHabits, cloudAspirations } from './supabaseStorage';

export interface HabitRecipe {
    id: string;
    // Core Recipe
    anchor: string;
    tiny_behavior: string;
    // Context Data
    original_behavior: string;
    motivation: number;
    ability: number;
    ai_suggestion: string;
    environment_setup?: {
        design_script: string;
        ready_checklist: string[];
    };
    aspiration?: string; // Vision Layer
    difficulty_level: number; // Evolution Layer
    evolution_log: { date: string; type: 'creation' | 'upgrade' | 'downgrade'; change: string; note?: string }[];
    // Stats
    created_at: string;
    completed_count: number;
    last_completed?: string;
    history?: string[]; // ISO Date Strings
    // Shine & Prompt Layers (Level 5.3 & 5.4)
    celebration_method: string;
    backup_time?: string; // e.g. "20:00"
    // Pearl Habits (Feature 1)
    habit_type?: 'regular' | 'pearl'; // regular = normal anchor, pearl = irritation as trigger
    // Weekly Review (Feature 2)
    paused?: boolean; // Whether habit is paused/archived
    current_streak?: number; // Current streak count
    // Auto-Scaling (Fogg: Scaling Back)
    consecutive_failures?: number; // Track consecutive failures for auto-scaling
    scaled_versions?: string[]; // Preset simpler versions of the behavior
    // Habit Chaining (Fogg: Behavior Sequence)
    next_habit_id?: string; // ID of habit to prompt after this one completes
}

export const useHabits = () => {
    const [habits, setHabits] = useState<HabitRecipe[]>([]);
    const [aspirations, setAspirations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load - Cloud Only
    useEffect(() => {
        const loadFromCloud = async () => {
            setIsLoading(true);
            try {
                const [cloudData, cloudAsp] = await Promise.all([
                    cloudHabits.fetchAll(),
                    cloudAspirations.fetchAll()
                ]);
                setHabits(cloudData);
                setAspirations(cloudAsp.length > 0 ? cloudAsp : ["健康 Health", "工作 Career", "快乐 Happiness"]);
            } catch (e) {
                console.error("Failed to load from cloud", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadFromCloud();

        // Prompt Layer: Request Notification Permission
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    // Helper to refresh habits from cloud (optional, mostly we update optimistic or direct)
    const refreshHabits = async () => {
        const data = await cloudHabits.fetchAll();
        setHabits(data);
    };

    // Prompt Layer & Time Checks (Running on local state)
    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            habits.forEach(h => {
                if (h.backup_time === currentTime) {
                    // Check if done today
                    const lastCompletion = h.history && h.history.length > 0 ? h.history[h.history.length - 1] : 0;
                    // Handle object history items in localstorage just in case (legacy support)
                    let lastDateStr = lastCompletion;
                    if (typeof lastCompletion === 'object' && ((lastCompletion as any).date)) lastDateStr = (lastCompletion as any).date;

                    const isDoneToday = new Date(lastDateStr as string).toDateString() === now.toDateString();

                    if (!isDoneToday) {
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification(`⏰ 提示: ${h.tiny_behavior}`, {
                                body: `不要忘了你的微习惯！现在从"${h.anchor}"开始吧！`,
                                icon: '/pwa-192x192.png'
                            });
                        }
                    }
                }
            });
        }, 60000);
        return () => clearInterval(intervalId);
    }, [habits]);


    const addHabit = async (anchor: string, behavior: string, environment?: any, aspiration?: string, celebration: string = "握拳说“Yes!”", backupTime?: string, habitType: 'regular' | 'pearl' = 'regular'): Promise<string> => {
        const newHabit: HabitRecipe = {
            id: crypto.randomUUID(), // Fix: Supabase requires UUID format, not timestamp string
            anchor,
            tiny_behavior: behavior,
            original_behavior: "",
            motivation: 5,
            ability: 5,
            ai_suggestion: "",
            created_at: new Date().toISOString(),
            completed_count: 0,
            history: [],
            environment_setup: environment,
            aspiration: aspiration || "Uncategorized",
            difficulty_level: 1,
            evolution_log: [{
                date: new Date().toISOString(),
                type: 'creation',
                change: `Started: "${behavior}"`
            }],
            celebration_method: celebration,
            backup_time: backupTime,
            habit_type: habitType
        };

        // Optimistic UI
        const prevHabits = [...habits];
        setHabits([...habits, newHabit]);

        const success = await cloudHabits.upsert(newHabit);
        if (!success) {
            alert("❌ 同步到云端失败，请检查网络");
            setHabits(prevHabits); // Revert
        }

        return newHabit.id; // Return the ID for chaining
    };

    const evolveHabit = async (id: string, newAnchor: string, newBehavior: string, type: 'upgrade' | 'downgrade' = 'upgrade') => {
        const target = habits.find(h => h.id === id);
        if (!target) return;

        const oldBehavior = target.tiny_behavior;
        const newLevel = type === 'upgrade' ? (target.difficulty_level || 1) + 1 : Math.max(1, (target.difficulty_level || 1) - 1);

        const updatedHabit: HabitRecipe = {
            ...target,
            anchor: newAnchor,
            tiny_behavior: newBehavior,
            difficulty_level: newLevel,
            evolution_log: [
                ...target.evolution_log,
                {
                    date: new Date().toISOString(),
                    type,
                    change: `${type === 'upgrade' ? 'Level Up' : 'Adjustment'}: ${oldBehavior} -> ${newBehavior}`
                }
            ]
        };

        // Optimistic UI
        const prevHabits = [...habits];
        setHabits(habits.map(h => h.id === id ? updatedHabit : h));

        const success = await cloudHabits.upsert(updatedHabit);
        if (!success) {
            alert("❌ 同步到云端失败");
            setHabits(prevHabits);
        }
    };

    const deleteHabit = async (id: string) => {
        console.log("[deleteHabit] Deleting habit:", id);

        // 直接删除（浏览器原生confirm被阻止了）
        const prevHabits = [...habits];
        setHabits(habits.filter(h => h.id !== id));

        const success = await cloudHabits.delete(id);
        console.log("[deleteHabit] Cloud delete result:", success);

        if (!success) {
            alert("❌ 云端删除失败");
            setHabits(prevHabits);
        }
    };

    const checkInHabit = async (id: string): Promise<{ nextHabitId?: string }> => {
        const target = habits.find(h => h.id === id);
        if (!target) return {};

        const now = new Date().toISOString();
        const updatedHabit: HabitRecipe = {
            ...target,
            completed_count: target.completed_count + 1,
            last_completed: now,
            history: [...(target.history || []), now],
            consecutive_failures: 0,
            current_streak: (target.current_streak || 0) + 1,
        };

        // Optimistic UI
        const prevHabits = [...habits];
        setHabits(habits.map(h => h.id === id ? updatedHabit : h));

        cloudHabits.upsert(updatedHabit).then(success => {
            if (!success) {
                // Silent fail or toast? for check-in silent is maybe ok, but data consistency matters.
                console.error("Failed to sync check-in");
                // We don't revert check-in immediately to avoid jarring UX, but it won't persist if reload.
            }
        });

        return { nextHabitId: target.next_habit_id };
    };

    const updateHabit = async (id: string, updates: Partial<HabitRecipe>) => {
        console.log('[updateHabit] Called with:', { id, updates });

        const target = habits.find(h => h.id === id);
        if (!target) {
            console.error('[updateHabit] Target habit not found:', id);
            return;
        }

        const updatedHabit = { ...target, ...updates };
        console.log('[updateHabit] Saving to cloud:', { id: updatedHabit.id, next_habit_id: updatedHabit.next_habit_id });

        setHabits(habits.map(h => h.id === id ? updatedHabit : h));
        const success = await cloudHabits.upsert(updatedHabit);
        console.log('[updateHabit] Cloud save result:', success);
    };

    const addAspiration = async (newAspiration: string) => {
        if (!aspirations.includes(newAspiration)) {
            const updated = [...aspirations, newAspiration];
            setAspirations(updated);
            await cloudAspirations.add(newAspiration);
        }
    };

    const pauseHabit = async (id: string, paused: boolean) => {
        updateHabit(id, { paused });
    };

    const getWeeklyCompletionRate = (habit: HabitRecipe): number => {
        if (!habit.history || habit.history.length === 0) return 0;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const daysCompleted = new Set<string>();
        habit.history.forEach(timestamp => {
            const date = new Date(timestamp);
            if (date >= oneWeekAgo) daysCompleted.add(date.toDateString());
        });
        return Math.round((daysCompleted.size / 7) * 100);
    };

    const recordFailure = (id: string): { shouldScale: boolean; failures: number; scaledSuggestion?: string } => {
        const target = habits.find(h => h.id === id);
        if (!target) return { shouldScale: false, failures: 0 };

        const failures = (target.consecutive_failures || 0) + 1;
        let scaledSuggestion: string | undefined;
        if (failures >= 3 && target.scaled_versions && target.scaled_versions.length > 0) {
            scaledSuggestion = target.scaled_versions[0];
        }

        const updatedHabit = {
            ...target,
            consecutive_failures: failures,
            current_streak: 0
        };

        setHabits(habits.map(h => h.id === id ? updatedHabit : h));
        cloudHabits.upsert(updatedHabit);

        return { shouldScale: failures >= 3, failures, scaledSuggestion };
    };

    const setHabitChain = async (id: string, nextHabitId: string | null) => {
        await updateHabit(id, { next_habit_id: nextHabitId || undefined });
    };

    const setScaledVersions = (id: string, versions: string[]) => {
        updateHabit(id, { scaled_versions: versions });
    };

    return { habits, addHabit, deleteHabit, checkInHabit, updateHabit, evolveHabit, aspirations, addAspiration, pauseHabit, getWeeklyCompletionRate, recordFailure, setHabitChain, setScaledVersions, isLoading };
};

