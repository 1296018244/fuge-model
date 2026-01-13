/**
 * Identity Tags Utility (Feature 3)
 * Maps behaviors to identity labels and calculates milestone levels.
 */

// Identity mapping table - maps keywords to identity info
const IDENTITY_MAP: Record<string, { emoji: string; name: string }> = {
    // 运动类
    '跑步': { emoji: '🏃', name: '跑者' },
    '跑': { emoji: '🏃', name: '跑者' },
    'run': { emoji: '🏃', name: '跑者' },
    '健身': { emoji: '💪', name: '运动家' },
    '俯卧撑': { emoji: '💪', name: '运动家' },
    '锻炼': { emoji: '💪', name: '运动家' },
    '瑜伽': { emoji: '🧘', name: '瑜伽士' },

    // 阅读与学习
    '阅读': { emoji: '📚', name: '读书人' },
    '读书': { emoji: '📚', name: '读书人' },
    '看书': { emoji: '📚', name: '读书人' },
    'read': { emoji: '📚', name: '读书人' },
    '学习': { emoji: '🎓', name: '学习者' },
    '学': { emoji: '🎓', name: '学习者' },

    // 身心健康
    '冥想': { emoji: '🧘', name: '冥想者' },
    '打坐': { emoji: '🧘', name: '冥想者' },
    '深呼吸': { emoji: '🌬️', name: '呼吸师' },
    '喝水': { emoji: '💧', name: '水润达人' },
    '水': { emoji: '💧', name: '水润达人' },

    // 写作与创意
    '写作': { emoji: '✍️', name: '写作者' },
    '写': { emoji: '✍️', name: '写作者' },
    '日记': { emoji: '📔', name: '日记家' },
    '画': { emoji: '🎨', name: '艺术家' },
    '创作': { emoji: '🎨', name: '创作者' },

    // 效率与整理
    '整理': { emoji: '🧹', name: '整理师' },
    '清洁': { emoji: '🧹', name: '整理师' },
    '计划': { emoji: '📋', name: '计划达人' },
    '早起': { emoji: '🌅', name: '早起鸟' },
    '起床': { emoji: '🌅', name: '早起鸟' },

    // 社交类
    '感谢': { emoji: '🙏', name: '感恩者' },
    '联系': { emoji: '💬', name: '连接者' },
    '问候': { emoji: '👋', name: '连接者' },
};

// Milestone thresholds
const MILESTONES = {
    1: 20,   // 入门
    2: 50,   // 坚持
    3: 100,  // 大师
};

// Level names
const LEVEL_NAMES = {
    1: '入门',
    2: '坚持',
    3: '大师',
};

export interface IdentityBadge {
    emoji: string;
    name: string;
    level: number;
    levelName: string;
}

/**
 * Get identity badge based on behavior text and completion count.
 * Returns null if no milestone has been reached (< 20 completions).
 */
export function getIdentityBadge(behavior: string, completedCount: number): IdentityBadge | null {
    // Only show badge after first milestone
    if (completedCount < MILESTONES[1]) {
        return null;
    }

    // Determine level
    let level = 1;
    if (completedCount >= MILESTONES[3]) {
        level = 3;
    } else if (completedCount >= MILESTONES[2]) {
        level = 2;
    }

    // Find matching identity
    const lowerBehavior = behavior.toLowerCase();

    for (const [keyword, identity] of Object.entries(IDENTITY_MAP)) {
        if (lowerBehavior.includes(keyword.toLowerCase())) {
            return {
                ...identity,
                level,
                levelName: LEVEL_NAMES[level as keyof typeof LEVEL_NAMES],
            };
        }
    }

    // Fallback: Generic achiever identity
    return {
        emoji: '⭐',
        name: '成就者',
        level,
        levelName: LEVEL_NAMES[level as keyof typeof LEVEL_NAMES],
    };
}

/**
 * Get progress towards next milestone.
 */
export function getMilestoneProgress(completedCount: number): { current: number; next: number; percentage: number } | null {
    if (completedCount >= MILESTONES[3]) {
        return null; // Already at max level
    }

    let current = 0;
    let next = MILESTONES[1];

    if (completedCount >= MILESTONES[2]) {
        current = MILESTONES[2];
        next = MILESTONES[3];
    } else if (completedCount >= MILESTONES[1]) {
        current = MILESTONES[1];
        next = MILESTONES[2];
    }

    const percentage = Math.round(((completedCount - current) / (next - current)) * 100);

    return { current, next, percentage };
}
