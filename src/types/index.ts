export interface EvolutionLogItem {
    date: string;
    type: 'creation' | 'upgrade' | 'downgrade';
    change: string;
    note?: string;
}

export interface EnvironmentSetup {
    design_script?: string;
    ready_checklist?: string[];
}

// Canonical Habit Entity
export interface Habit {
    id: string;
    local_id?: string; // For migration tracking

    // Core Recipe
    anchor: string;
    tiny_behavior: string;

    // Context Data
    original_behavior: string;
    motivation: number;
    ability: number;
    ai_suggestion: string;

    environment_setup?: EnvironmentSetup;

    aspiration?: string; // Vision Layer
    difficulty_level: number; // Evolution Layer
    evolution_log: EvolutionLogItem[];

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

// Inherit for compatibility if needed, or just use Habit everywhere
export type HabitRecipe = Habit;

export interface Cluster {
    anchor: string;
    normalizedAnchor: string;
    habits: Habit[];
    totalCompletions: number;
    chainedCount: number;
}

// AI Service Types
export interface AnalysisResult {
    behavior: string;
    score: number;
    suggestion: string;
    analysis?: string;
    recipe?: {
        anchor: string;
        tiny_behavior: string;
    };
    environment_setup?: string[];
}

export interface PraiseResult {
    message: string;
    emoji: string;
}

// AI Configuration for multiple API providers
export interface AIConfig {
    id: string;
    name: string;
    api_key: string;
    base_url: string;
    model_name: string;
    is_active: boolean;
    priority: number;
    created_at?: string;
    updated_at?: string;
}

export interface BackupData {
    version: number;
    timestamp: string;
    habits: Habit[];
    aspirations: string[];
    ai_configs: AIConfig[];
    settings: {
        openai_api_key?: string;
        openai_base_url?: string;
        model_name?: string;
    };
}

// AI Service Strict Types
export interface AIErrorResponse {
    error?: {
        message: string;
        type?: string;
        param?: string;
        code?: string;
    } | string;
    // Non-standard provider errors
    status?: string | number;
    msg?: string;
    body?: any;
}

export interface AIChatCompletionChoice {
    index: number;
    message: {
        role: string;
        content: string;
    };
    finish_reason: string;
}

export interface AIChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: AIChatCompletionChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    // Non-standard errors might appear here too if 200 OK
    status?: string | number;
    msg?: string;
    error?: any;
}
