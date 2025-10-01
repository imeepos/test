-- 添加缺失的节点字段
-- 将 importance 重命名为 importance_level
ALTER TABLE nodes RENAME COLUMN importance TO importance_level;

-- 将 confidence 重命名为 confidence_score
ALTER TABLE nodes RENAME COLUMN confidence TO confidence_score;

-- 添加 semantic_type 字段
ALTER TABLE nodes ADD COLUMN semantic_type VARCHAR(50) DEFAULT 'text';

-- 更新状态检查约束（添加缺失的状态）
ALTER TABLE nodes DROP CONSTRAINT IF EXISTS nodes_status_check;
ALTER TABLE nodes ADD CONSTRAINT nodes_status_check
  CHECK (status IN ('idle', 'processing', 'completed', 'error', 'deleted', 'active', 'draft', 'archived'));

-- 更新 importance_level 检查约束保持不变（已经是 1-5）
-- 更新 confidence_score 检查约束保持不变（已经是 0-1）

-- 为 semantic_type 创建索引以提高查询性能
CREATE INDEX idx_nodes_semantic_type ON nodes(semantic_type);
