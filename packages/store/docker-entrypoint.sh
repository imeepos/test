#!/bin/bash
set -e

echo "🚀 Starting Store Service..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 等待 PostgreSQL 准备就绪
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h ${PG_HOST:-postgres} -p ${PG_PORT:-5432} -U ${PG_USER:-sker_user}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready"

# 等待 Redis 准备就绪
echo "⏳ Waiting for Redis..."
until redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready"

# 运行数据库迁移
echo ""
echo "📦 Running database migrations..."
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  npm run migrate:auto || {
    echo "⚠️ Migration failed, but continuing..."
  }
else
  npm run migrate || {
    echo "⚠️ Migration failed, but continuing..."
  }
fi

# 运行种子数据（仅在开发环境）
if [ "${NODE_ENV}" = "development" ] && [ "${AUTO_SEED:-false}" = "true" ]; then
  echo ""
  echo "🌱 Running database seeds..."
  npm run seed || {
    echo "⚠️ Seeding failed, but continuing..."
  }
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Store Service is starting..."
echo ""

# 启动应用
exec "$@"
