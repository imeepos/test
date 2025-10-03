-- 扩展 connections.type 允许的取值范围，支持 AI 生成的连线类型
ALTER TABLE connections
  DROP CONSTRAINT IF EXISTS connections_type_check;

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
