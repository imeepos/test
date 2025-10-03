-- 为连接表添加 bidirectional 字段并扩展类型约束
-- 1. 增加 bidirectional 字段用于显式标识连线是否双向
ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS bidirectional BOOLEAN NOT NULL DEFAULT false;

-- 2. 使用现有 type 信息回填双向标记，保证历史数据一致性
UPDATE connections
SET bidirectional = CASE WHEN type = 'bidirectional' THEN true ELSE false END;

-- 3. 扩展连接类型约束，兼容前端默认的 "related" 类型
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_type_check;
ALTER TABLE connections
  ADD CONSTRAINT connections_type_check
  CHECK (
    type IN (
      'input',
      'output',
      'bidirectional',
      'dependency',
      'reference',
      'related',
      'expand',
      'fusion',
      'analysis',
      'summary',
      'synthesis',
      'comparison',
      'plan',
      'decision'
    )
  );

-- 4. 为 bidirectional 字段创建索引，提升基于方向的查询性能
CREATE INDEX IF NOT EXISTS idx_connections_bidirectional
  ON connections (bidirectional);
