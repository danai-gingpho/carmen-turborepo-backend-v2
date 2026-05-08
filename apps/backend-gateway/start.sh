#!/bin/bash

# Backend Gateway Start Script
# Usage: ./start.sh [command]
# Commands: install, build, test, dev, start, prod, all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Print colored message
print_msg() {
    echo -e "${BLUE}[backend-gateway]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Show help
show_help() {
    echo ""
    echo "Backend Gateway Start Script"
    echo ""
    echo "Usage: ./start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install     Install npm dependencies"
    echo "  build       Build the application"
    echo "  test        Run unit tests"
    echo "  test:cov    Run tests with coverage"
    echo "  test:watch  Run tests in watch mode"
    echo "  dev         Start in development mode (watch)"
    echo "  start       Start the application"
    echo "  prod        Start in production mode"
    echo "  lint        Run linter"
    echo "  format      Format code with prettier"
    echo "  all         Install, build, test, and start"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./start.sh install    # Install dependencies"
    echo "  ./start.sh build      # Build the project"
    echo "  ./start.sh test       # Run tests"
    echo "  ./start.sh dev        # Start dev server"
    echo "  ./start.sh all        # Full setup and start"
    echo ""
}

# Install dependencies
do_install() {
    print_msg "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Build application
do_build() {
    print_msg "Building application..."
    npm run build
    print_success "Build completed"
}

# Run tests
do_test() {
    print_msg "Running tests..."
    npm test
    print_success "Tests completed"
}

# Run tests with coverage
do_test_cov() {
    print_msg "Running tests with coverage..."
    npm run test:cov
    print_success "Tests with coverage completed"
}

# Run tests in watch mode
do_test_watch() {
    print_msg "Running tests in watch mode..."
    npm run test:watch
}

# Start in development mode
do_dev() {
    print_msg "Starting in development mode..."
    npm run dev
}

# Start application
do_start() {
    print_msg "Starting application..."
    npm run start
}

# Start in production mode
do_prod() {
    print_msg "Starting in production mode..."
    npm run start:prod
}

# Run linter
do_lint() {
    print_msg "Running linter..."
    npm run lint
    print_success "Linting completed"
}

# Format code
do_format() {
    print_msg "Formatting code..."
    npm run format
    print_success "Formatting completed"
}

# Full setup: install, build, test, start
do_all() {
    print_msg "Running full setup..."
    echo ""
    do_install
    echo ""
    do_build
    echo ""
    do_test
    echo ""
    print_success "Full setup completed. Starting application..."
    echo ""
    do_dev
}

# Main
case "${1:-help}" in
    install)
        do_install
        ;;
    build)
        do_build
        ;;
    test)
        do_test
        ;;
    test:cov)
        do_test_cov
        ;;
    test:watch)
        do_test_watch
        ;;
    dev)
        do_dev
        ;;
    start)
        do_start
        ;;
    prod)
        do_prod
        ;;
    lint)
        do_lint
        ;;
    format)
        do_format
        ;;
    all)
        do_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
