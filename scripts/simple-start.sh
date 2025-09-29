#!/bin/bash

# SKER 简化启动脚本

echo "🚀 SKER 后端启动选项："
echo ""
echo "1. 开发模式 - 只启动数据库等基础设施，代码在本地运行"
echo "2. 生产模式 - 启动完整的容器化服务栈"
echo "3. 单体模式 - 只启动一个包含所有功能的服务（推荐）"
echo ""

read -p "请选择模式 (1/2/3): " choice

case $choice in
    1)
        echo "🔧 启动开发模式..."
        echo "启动：PostgreSQL + Redis + RabbitMQ"
        docker-compose -f docker-compose.dev.yml up -d
        echo ""
        echo "✅ 基础设施已启动，现在您可以："
        echo "   cd packages/store && npm run dev    # 启动数据服务"
        echo "   cd packages/gateway && npm run dev  # 启动API网关"
        echo "   cd packages/engine && npm run server:dev  # 启动AI引擎"
        echo ""
        echo "或者运行: pnpm run dev:all  # 同时启动所有服务"
        ;;
    2)
        echo "🏭 启动生产模式..."
        echo "启动：完整的微服务栈"
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "⚠️  请编辑 .env 文件设置 OPENAI_API_KEY"
            read -p "按Enter继续..."
        fi
        docker-compose up -d
        echo ""
        echo "✅ 生产环境已启动："
        echo "   Gateway: http://localhost:8000"
        echo "   Engine:  http://localhost:8001"
        echo "   Store:   http://localhost:3001"
        echo "   Broker:  http://localhost:3002"
        ;;
    3)
        echo "🎯 启动单体模式..."
        echo "这将启动一个包含所有功能的简化服务"
        # 这里可以启动一个合并的服务
        echo "⚠️  单体模式正在开发中，请选择模式1或2"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac