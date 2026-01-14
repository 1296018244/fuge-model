-- AI 配置表
-- 用于存储多个 AI API 配置

CREATE TABLE IF NOT EXISTS ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    base_url TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
    model_name TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    is_active BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 确保只有一个激活配置的触发器
CREATE OR REPLACE FUNCTION ensure_single_active_config()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE ai_configs SET is_active = FALSE WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_active_config ON ai_configs;
CREATE TRIGGER trigger_single_active_config
    AFTER INSERT OR UPDATE OF is_active ON ai_configs
    FOR EACH ROW
    WHEN (NEW.is_active = TRUE)
    EXECUTE FUNCTION ensure_single_active_config();

-- RLS 策略 (可选，根据需要启用)
-- ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON ai_configs FOR ALL USING (true);
