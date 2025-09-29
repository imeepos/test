#!/bin/bash

# SKER Backend Services Docker Startup Script

set -e

echo "🚀 Starting SKER Backend Services..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual configuration values"
    echo "   Especially set your OPENAI_API_KEY"
    read -p "Press Enter to continue after editing .env file..."
fi

# Function to start development infrastructure
start_dev_infra() {
    echo "🔧 Starting development infrastructure (PostgreSQL, Redis, RabbitMQ)..."
    docker-compose -f docker-compose.dev.yml up -d
    echo "✅ Development infrastructure started"
    echo "   - PostgreSQL: localhost:5432"
    echo "   - Redis: localhost:6379"
    echo "   - RabbitMQ: localhost:5672 (Management UI: http://localhost:15672)"
}

# Function to start full production stack
start_production() {
    echo "🏭 Starting full production stack..."
    docker-compose up -d
    echo "✅ Production stack started"
    echo "   - Gateway API: http://localhost:8000"
    echo "   - Engine API: http://localhost:8001"
    echo "   - Store Service: http://localhost:3001"
    echo "   - Broker Service: http://localhost:3002"
    echo "   - RabbitMQ Management: http://localhost:15672"
}

# Function to show logs
show_logs() {
    echo "📋 Showing logs for all services..."
    docker-compose logs -f
}

# Function to stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    echo "✅ All services stopped"
}

# Function to clean up (remove volumes)
cleanup() {
    echo "🧹 Cleaning up all data (this will remove all data!)..."
    read -p "Are you sure? This will delete all database data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        docker-compose -f docker-compose.dev.yml down -v
        docker system prune -f
        echo "✅ Cleanup completed"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    docker-compose -f docker-compose.dev.yml ps
}

# Main menu
case "${1:-}" in
    "dev")
        start_dev_infra
        ;;
    "prod")
        start_production
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "clean")
        cleanup
        ;;
    *)
        echo "SKER Backend Docker Management"
        echo ""
        echo "Usage: $0 {dev|prod|logs|status|stop|clean}"
        echo ""
        echo "Commands:"
        echo "  dev     - Start development infrastructure only (PostgreSQL, Redis, RabbitMQ)"
        echo "  prod    - Start full production stack (all services)"
        echo "  logs    - Show logs from all running services"
        echo "  status  - Show status of all services"
        echo "  stop    - Stop all running services"
        echo "  clean   - Stop and remove all data (WARNING: destructive)"
        echo ""
        echo "Examples:"
        echo "  ./scripts/docker-start.sh dev     # For local development"
        echo "  ./scripts/docker-start.sh prod    # For production deployment"
        echo "  ./scripts/docker-start.sh logs    # Monitor logs"
        echo "  ./scripts/docker-start.sh stop    # Stop all services"
        ;;
esac