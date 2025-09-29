#!/bin/bash

# @sker/research Docker deployment script

set -e

echo "🔬 Starting @sker/research deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p ./data/uploads
mkdir -p ./data/processed
mkdir -p ./data/cache
mkdir -p ./logs
mkdir -p ./ssl

# Check if .env file exists
if [ ! -f ./.env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual configuration before continuing."
    read -p "Press Enter to continue after editing .env file..."
fi

# Check if required environment variables are set
print_status "Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OPENAI_API_KEY not set. Academic AI features may not work."
fi

if [ -z "$PUBMED_API_KEY" ]; then
    print_warning "PUBMED_API_KEY not set. PubMed integration may be limited."
fi

# Start the main infrastructure services first
print_status "Starting core infrastructure services..."
cd ../..
$DOCKER_COMPOSE up -d postgres redis rabbitmq

# Wait for services to be healthy
print_status "Waiting for database services to be ready..."
$DOCKER_COMPOSE exec postgres pg_isready -U sker_user -d sker_db || {
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
}

# Start core application services
print_status "Starting core application services..."
$DOCKER_COMPOSE up -d store broker engine gateway

# Wait for core services
print_status "Waiting for core services to be ready..."
sleep 15

# Build and start research application
print_status "Building and starting research application..."
cd apps/research
$DOCKER_COMPOSE -f docker-compose.research.yml up -d --build

# Health check
print_status "Performing health checks..."
sleep 30

# Check research app health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Research application is healthy!"
else
    print_error "Research application health check failed."
    print_status "Checking logs..."
    $DOCKER_COMPOSE -f docker-compose.research.yml logs research
fi

# Check academic API service
if curl -f http://localhost:3003/health > /dev/null 2>&1; then
    print_success "Academic API service is healthy!"
else
    print_warning "Academic API service health check failed. Check logs if needed."
fi

# Display service status
print_status "Service Status:"
echo "=================================="
echo "🔬 Research App:     http://localhost:3000"
echo "🔧 API Gateway:      http://localhost:8000"
echo "📚 Academic API:     http://localhost:3003"
echo "📊 Stats Compute:    http://localhost:3004"
echo "📄 Doc Processor:    http://localhost:3005"
echo "🐰 RabbitMQ Admin:   http://localhost:15672"
echo "=================================="

print_success "🎉 @sker/research deployment completed!"

# Display next steps
echo ""
print_status "Next Steps:"
echo "1. Visit http://localhost:3000 to access the research application"
echo "2. Check logs: $DOCKER_COMPOSE -f docker-compose.research.yml logs -f"
echo "3. Stop services: $DOCKER_COMPOSE -f docker-compose.research.yml down"
echo "4. Update configuration in .env file as needed"

# Optional: tail logs
read -p "Would you like to tail the application logs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Tailing application logs (Ctrl+C to exit)..."
    $DOCKER_COMPOSE -f docker-compose.research.yml logs -f research
fi