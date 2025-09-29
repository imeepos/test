#!/bin/bash

# SKER 系统集成测试运行脚本

set -e

echo "🧪 开始 SKER 系统集成测试"
echo "==============================="

# 检查环境变量
echo "🔍 检查环境配置..."

if [ -z "$TEST_DATABASE_URL" ]; then
  echo "⚠️ TEST_DATABASE_URL 未设置，使用默认值"
  export TEST_DATABASE_URL="postgresql://localhost/sker_test"
fi

if [ -z "$TEST_RABBITMQ_URL" ]; then
  echo "⚠️ TEST_RABBITMQ_URL 未设置，使用默认值"
  export TEST_RABBITMQ_URL="amqp://localhost"
fi

if [ -z "$TEST_REDIS_URL" ]; then
  echo "⚠️ TEST_REDIS_URL 未设置，使用默认值"
  export TEST_REDIS_URL="redis://localhost"
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️ OPENAI_API_KEY 未设置，AI相关测试将被跳过"
fi

echo "✅ 环境配置检查完成"

# 构建所有包
echo "🔨 构建所有服务包..."
npm run build:all

# 运行测试前的准备
echo "⚙️ 准备测试环境..."

# 检查必要的服务是否运行
echo "🔍 检查测试服务状态..."

check_service() {
  local service_name=$1
  local check_command=$2

  if eval $check_command > /dev/null 2>&1; then
    echo "✅ $service_name 可用"
    return 0
  else
    echo "⚠️ $service_name 不可用，相关测试可能被跳过"
    return 1
  fi
}

check_service "PostgreSQL" "pg_isready -h localhost"
check_service "Redis" "redis-cli ping"
check_service "RabbitMQ" "rabbitmqctl status"

# 创建测试数据库（如果不存在）
echo "🗄️ 准备测试数据库..."
createdb sker_test 2>/dev/null || echo "测试数据库已存在或无法创建"

# 运行集成测试
echo "🚀 运行集成测试..."
echo "==============================="

# 设置测试环境
export NODE_ENV=test
export LOG_LEVEL=warn

# 运行Jest集成测试
jest --config jest.config.integration.js --runInBand --verbose

echo "==============================="
echo "📊 生成测试报告..."

# 显示覆盖率报告
if [ -d "coverage/integration" ]; then
  echo "📋 代码覆盖率报告已生成："
  echo "  - HTML: coverage/integration/lcov-report/index.html"
  echo "  - LCOV: coverage/integration/lcov.info"
fi

echo "✅ SKER 系统集成测试完成"