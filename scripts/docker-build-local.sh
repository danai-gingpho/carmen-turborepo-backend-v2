#!/bin/bash

# Docker Build Local Script
# Builds Docker images locally for the carmen-turborepo-backend project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_PREFIX="carmen"
IMAGE_TAG="local"
NO_CACHE=""
PARALLEL=""
YES=""

# All available services
ALL_SERVICES=(
    "backend-gateway"
    "micro-authen"
    "micro-cluster"
    "micro-cronjob"
    "micro-file"
    "micro-keycloak-api"
    "micro-license"
    "micro-log"
    "micro-notification"
    "micro-reports"
    "micro-tenant-inventory"
    "micro-tenant-master"
    "micro-tenant-procurement"
    "micro-tenant-recipe"
)

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_usage() {
    echo -e "${BLUE}Usage:${NC} $0 [OPTIONS] [SERVICE...]"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  -h, --help           Show this help message"
    echo "  -t, --tag TAG        Image tag (default: local)"
    echo "  -p, --prefix PREFIX  Image prefix (default: carmen)"
    echo "  --no-cache           Build without cache"
    echo "  --parallel           Build images in parallel (experimental)"
    echo "  -y, --yes            Skip confirmation prompt"
    echo "  -l, --list           List all available services"
    echo ""
    echo -e "${BLUE}Services:${NC}"
    echo "  all                  Build all services"
    echo "  gateway              Build backend-gateway only"
    echo "  <service-name>       Build specific service(s)"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0                           # Build all services"
    echo "  $0 backend-gateway           # Build only backend-gateway"
    echo "  $0 micro-authen micro-file   # Build multiple services"
    echo "  $0 -t dev backend-gateway    # Build with custom tag"
    echo "  $0 --no-cache all            # Build all without cache"
}

list_services() {
    echo -e "${BLUE}Available services:${NC}"
    for service in "${ALL_SERVICES[@]}"; do
        echo "  - $service"
    done
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

build_service() {
    local service=$1
    local dockerfile="$PROJECT_ROOT/apps/$service/Dockerfile"
    local image_name="$IMAGE_PREFIX-$service:$IMAGE_TAG"

    if [[ ! -f "$dockerfile" ]]; then
        log_error "Dockerfile not found: $dockerfile"
        return 1
    fi

    log_info "Building $image_name..."

    local build_args="--file $dockerfile --tag $image_name"

    if [[ -n "$NO_CACHE" ]]; then
        build_args="$build_args --no-cache"
    fi

    if docker build $build_args "$PROJECT_ROOT"; then
        log_success "Built $image_name"
        return 0
    else
        log_error "Failed to build $image_name"
        return 1
    fi
}

build_services_parallel() {
    local services=("$@")
    local pids=()
    local failed=0

    for service in "${services[@]}"; do
        build_service "$service" &
        pids+=($!)
    done

    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            failed=1
        fi
    done

    return $failed
}

build_services_sequential() {
    local services=("$@")
    local failed=0
    local built=0
    local total=${#services[@]}

    for service in "${services[@]}"; do
        built=$((built + 1))
        echo ""
        log_info "Building service $built of $total: $service"
        if ! build_service "$service"; then
            failed=1
        fi
    done

    return $failed
}

# Parse arguments
SERVICES_TO_BUILD=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_usage
            exit 0
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -p|--prefix)
            IMAGE_PREFIX="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE="1"
            shift
            ;;
        --parallel)
            PARALLEL="1"
            shift
            ;;
        -y|--yes)
            YES="1"
            shift
            ;;
        -l|--list)
            list_services
            exit 0
            ;;
        all)
            SERVICES_TO_BUILD=("${ALL_SERVICES[@]}")
            shift
            ;;
        gateway)
            SERVICES_TO_BUILD+=("backend-gateway")
            shift
            ;;
        *)
            # Check if it's a valid service name
            if [[ -d "$PROJECT_ROOT/apps/$1" ]]; then
                SERVICES_TO_BUILD+=("$1")
            else
                log_error "Unknown service or option: $1"
                echo ""
                print_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# If no services specified, build all
if [[ ${#SERVICES_TO_BUILD[@]} -eq 0 ]]; then
    SERVICES_TO_BUILD=("${ALL_SERVICES[@]}")
fi

# Remove duplicates
SERVICES_TO_BUILD=($(echo "${SERVICES_TO_BUILD[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

# Print build configuration
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Docker Local Build Configuration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Image prefix:    ${GREEN}$IMAGE_PREFIX${NC}"
echo -e "Image tag:       ${GREEN}$IMAGE_TAG${NC}"
echo -e "No cache:        ${GREEN}${NO_CACHE:-no}${NC}"
echo -e "Parallel build:  ${GREEN}${PARALLEL:-no}${NC}"
echo -e "Services:        ${GREEN}${#SERVICES_TO_BUILD[@]}${NC}"
echo ""

# List services to build
log_info "Services to build:"
for service in "${SERVICES_TO_BUILD[@]}"; do
    echo "  - $service"
done
echo ""

# Confirm build
if [[ -z "$YES" ]]; then
    read -p "Proceed with build? [Y/n] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]?$ ]]; then
        log_warning "Build cancelled"
        exit 0
    fi
fi

# Start build
START_TIME=$(date +%s)

if [[ -n "$PARALLEL" ]]; then
    log_info "Starting parallel build..."
    build_services_parallel "${SERVICES_TO_BUILD[@]}"
    BUILD_RESULT=$?
else
    log_info "Starting sequential build..."
    build_services_sequential "${SERVICES_TO_BUILD[@]}"
    BUILD_RESULT=$?
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}========================================${NC}"
if [[ $BUILD_RESULT -eq 0 ]]; then
    log_success "All builds completed successfully!"
else
    log_error "Some builds failed"
fi
echo -e "Total time: ${GREEN}${DURATION}s${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# List built images
log_info "Built images:"
docker images --filter "reference=$IMAGE_PREFIX-*:$IMAGE_TAG" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

exit $BUILD_RESULT
