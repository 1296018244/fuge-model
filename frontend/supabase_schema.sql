-- 福格习惯助手 - Supabase 数据库表结构
-- 请在 Supabase 控制台 -> SQL Editor 中执行此脚本
-- 版本: 2.0 (包含自动缩减和习惯链功能)

-- 习惯表
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,  -- 使用前端生成的 ID
  local_id TEXT,  -- 保留原始 localStorage 的 ID，用于迁移
  anchor TEXT NOT NULL,
  tiny_behavior TEXT NOT NULL,
  original_behavior TEXT,
  motivation INT,
  ability INT,
  ai_suggestion TEXT,
  aspiration TEXT,
  celebration_method TEXT DEFAULT '握拳说"Yes!"',
  backup_time TEXT,
  habit_type TEXT DEFAULT 'regular',
  completed_count INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  last_completed TIMESTAMPTZ,
  history JSONB DEFAULT '[]',
  environment_setup JSONB,
  difficulty_level INT DEFAULT 1,
  evolution_log JSONB DEFAULT '[]',
  paused BOOLEAN DEFAULT false,
  -- 自动缩减 (Auto-Scaling)
  consecutive_failures INT DEFAULT 0,
  scaled_versions JSONB DEFAULT '[]',  -- 预设的更简单版本
  -- 习惯链 (Habit Chaining)
  next_habit_id TEXT,  -- 下一个习惯的 ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 愿景表
CREATE TABLE IF NOT EXISTS aspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 全局配置表 (API Key, Base URL等)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）并重新创建
DROP TRIGGER IF EXISTS habits_updated_at ON habits;
CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 禁用 RLS（单用户模式，不需要行级安全）
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE aspirations DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- 授予 anon 角色完全访问权限
GRANT ALL ON habits TO anon;
GRANT ALL ON aspirations TO anon;
GRANT ALL ON settings TO anon;

-- ============================================
-- 如果表已存在，使用以下语句添加新字段
-- ============================================
ALTER TABLE habits ADD COLUMN IF NOT EXISTS consecutive_failures INT DEFAULT 0;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS scaled_versions JSONB DEFAULT '[]';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS next_habit_id TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS original_behavior TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS motivation INT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS ability INT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS ai_suggestion TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS evolution_log JSONB DEFAULT '[]';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type TEXT DEFAULT 'regular';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS backup_time TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS paused BOOLEAN DEFAULT false;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS environment_setup JSONB;

