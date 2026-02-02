#!/bin/sh

#######################################
# Disk Cleanup Script for Alpine Linux / VM
# Usage: ./cleanup-disk.sh [--dry-run] [--all]
# Compatible with: Alpine Linux, Ubuntu, Debian
#######################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
CLEAN_ALL=false

# Detect OS
detect_os() {
    if [ -f /etc/alpine-release ]; then
        echo "alpine"
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    else
        echo "unknown"
    fi
}

OS_TYPE=$(detect_os)

# Detect privilege escalation command (sudo or doas)
if command -v sudo >/dev/null 2>&1; then
    PRIV="sudo"
elif command -v doas >/dev/null 2>&1; then
    PRIV="doas"
else
    PRIV=""
fi

# Parse arguments
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --all)
            CLEAN_ALL=true
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run    Show what would be cleaned without actually cleaning"
            echo "  --all        Run all cleanup tasks (including aggressive cleanup)"
            echo "  --help, -h   Show this help message"
            echo ""
            echo "Detected OS: $OS_TYPE"
            exit 0
            ;;
    esac
done

# Helper functions
log_info() {
    printf "${BLUE}[INFO]${NC} %s\n" "$1"
}

log_success() {
    printf "${GREEN}[SUCCESS]${NC} %s\n" "$1"
}

log_warn() {
    printf "${YELLOW}[WARN]${NC} %s\n" "$1"
}

log_error() {
    printf "${RED}[ERROR]${NC} %s\n" "$1"
}

get_disk_usage() {
    df -h / | awk 'NR==2 {print $5 " used (" $3 " of " $2 "), " $4 " available"}'
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        log_warn "[DRY-RUN] Would execute: $*"
    else
        eval "$@"
    fi
}

run_priv_cmd() {
    if [ -n "$PRIV" ]; then
        run_cmd "$PRIV $*"
    else
        run_cmd "$*"
    fi
}

#######################################
# Cleanup Functions
#######################################

cleanup_docker() {
    log_info "Cleaning up Docker..."

    if ! command -v docker >/dev/null 2>&1; then
        log_warn "Docker not found, skipping..."
        return
    fi

    echo "  - Stopped containers"
    echo "  - Unused networks"
    echo "  - Dangling images"
    echo "  - Build cache"

    if [ "$CLEAN_ALL" = true ]; then
        echo "  - ALL unused images (not just dangling)"
        run_cmd "docker system prune -af --volumes 2>/dev/null || true"
    else
        run_cmd "docker system prune -f 2>/dev/null || true"
    fi

    log_success "Docker cleanup completed"
}

cleanup_package_cache() {
    log_info "Cleaning up package cache..."

    case $OS_TYPE in
        alpine)
            # Alpine Linux - apk package manager
            log_info "Detected Alpine Linux, using apk..."
            run_priv_cmd "apk cache clean 2>/dev/null || true"
            run_priv_cmd "rm -rf /var/cache/apk/* 2>/dev/null || true"

            # Remove orphaned packages
            if [ "$CLEAN_ALL" = true ]; then
                # List orphaned packages (installed as deps but no longer needed)
                ORPHANS=$(apk info -r 2>/dev/null | grep -E "^$" -B1 | grep -v "^$" | grep -v "^--$" || true)
                if [ -n "$ORPHANS" ]; then
                    log_info "Found orphaned packages, consider removing manually"
                fi
            fi
            ;;
        debian)
            # Debian/Ubuntu - apt package manager
            log_info "Detected Debian/Ubuntu, using apt..."
            run_priv_cmd "apt-get clean -y 2>/dev/null || true"
            run_priv_cmd "apt-get autoremove -y 2>/dev/null || true"
            run_priv_cmd "apt-get autoclean -y 2>/dev/null || true"
            ;;
        *)
            log_warn "Unknown OS, skipping package cache cleanup..."
            return
            ;;
    esac

    log_success "Package cache cleanup completed"
}

cleanup_logs() {
    log_info "Cleaning up log files..."

    case $OS_TYPE in
        alpine)
            # Alpine uses busybox syslogd or other lightweight loggers
            # Logs are typically in /var/log/messages

            # Truncate main log files if they're too large (> 10MB)
            for logfile in /var/log/messages /var/log/dmesg; do
                if [ -f "$logfile" ]; then
                    SIZE=$(stat -c%s "$logfile" 2>/dev/null || echo "0")
                    if [ "$SIZE" -gt 10485760 ]; then
                        log_info "Truncating large log file: $logfile"
                        if [ "$DRY_RUN" = false ]; then
                            run_priv_cmd "tail -n 1000 $logfile > /tmp/log_truncate && mv /tmp/log_truncate $logfile || true"
                        else
                            log_warn "[DRY-RUN] Would truncate: $logfile"
                        fi
                    fi
                fi
            done
            ;;
        debian)
            # systemd journal cleanup
            if command -v journalctl >/dev/null 2>&1; then
                log_info "Cleaning journal logs (keeping last 3 days)..."
                run_priv_cmd "journalctl --vacuum-time=3d 2>/dev/null || true"
            fi
            ;;
    esac

    # Remove rotated logs (common for all distros)
    run_priv_cmd "find /var/log -name '*.gz' -delete 2>/dev/null || true"
    run_priv_cmd "find /var/log -name '*.old' -delete 2>/dev/null || true"
    run_priv_cmd "find /var/log -name '*.[0-9]' -delete 2>/dev/null || true"
    run_priv_cmd "find /var/log -name '*.[0-9].log' -delete 2>/dev/null || true"

    # Clean up specific log directories
    if [ "$CLEAN_ALL" = true ]; then
        run_priv_cmd "rm -rf /var/log/nginx/*.gz 2>/dev/null || true"
        run_priv_cmd "rm -rf /var/log/apache2/*.gz 2>/dev/null || true"
    fi

    log_success "Log cleanup completed"
}

cleanup_tmp() {
    log_info "Cleaning up temporary files..."

    # Clean /tmp files older than 7 days
    run_priv_cmd "find /tmp -type f -mtime +7 -delete 2>/dev/null || true"
    run_priv_cmd "find /tmp -type d -empty -delete 2>/dev/null || true"

    # Clean /var/tmp files older than 30 days
    run_priv_cmd "find /var/tmp -type f -mtime +30 -delete 2>/dev/null || true"

    # Alpine specific: clean /run if needed
    if [ "$OS_TYPE" = "alpine" ]; then
        run_priv_cmd "find /run -type f -name '*.pid' -mtime +1 -delete 2>/dev/null || true"
    fi

    log_success "Temporary files cleanup completed"
}

cleanup_npm_cache() {
    log_info "Cleaning up npm/pnpm/yarn cache..."

    if command -v npm >/dev/null 2>&1; then
        run_cmd "npm cache clean --force 2>/dev/null || true"
    fi

    if command -v pnpm >/dev/null 2>&1; then
        run_cmd "pnpm store prune 2>/dev/null || true"
    fi

    if command -v yarn >/dev/null 2>&1; then
        run_cmd "yarn cache clean 2>/dev/null || true"
    fi

    # Clean npm cache directory directly
    if [ -d "$HOME/.npm" ]; then
        if [ "$CLEAN_ALL" = true ]; then
            run_cmd "rm -rf $HOME/.npm/_cacache 2>/dev/null || true"
        fi
    fi

    log_success "npm/pnpm/yarn cache cleanup completed"
}

cleanup_git() {
    log_info "Cleaning up Git repositories..."

    # Clean current repo if in a git directory
    if [ -d .git ]; then
        # Remove lock files
        run_cmd "rm -f .git/index.lock 2>/dev/null || true"
        run_cmd "rm -f .git/HEAD.lock 2>/dev/null || true"
        run_cmd "rm -f .git/config.lock 2>/dev/null || true"

        # Run garbage collection
        if command -v git >/dev/null 2>&1; then
            run_cmd "git gc --prune=now 2>/dev/null || true"
            run_cmd "git remote prune origin 2>/dev/null || true"

            if [ "$CLEAN_ALL" = true ]; then
                run_cmd "git gc --aggressive --prune=now 2>/dev/null || true"
            fi
        fi
    fi

    log_success "Git cleanup completed"
}

cleanup_user_cache() {
    log_info "Cleaning up user cache..."

    # Common cache directories
    run_cmd "rm -rf $HOME/.cache/pip/* 2>/dev/null || true"
    run_cmd "rm -rf $HOME/.cache/go-build/* 2>/dev/null || true"
    run_cmd "rm -rf $HOME/.cache/thumbnails/* 2>/dev/null || true"

    if [ "$CLEAN_ALL" = true ]; then
        run_cmd "rm -rf $HOME/.cache/* 2>/dev/null || true"
    fi

    log_success "User cache cleanup completed"
}

cleanup_alpine_specific() {
    if [ "$OS_TYPE" != "alpine" ]; then
        return
    fi

    log_info "Running Alpine-specific cleanup..."

    # Clean apk cache
    run_priv_cmd "rm -rf /var/cache/apk/* 2>/dev/null || true"

    # Clean /var/cache/misc
    run_priv_cmd "rm -rf /var/cache/misc/* 2>/dev/null || true"

    # Clean man pages cache if exists
    run_priv_cmd "rm -rf /var/cache/man/* 2>/dev/null || true"

    # Remove backup files
    run_priv_cmd "find /etc -name '*.apk-new' -delete 2>/dev/null || true"

    # Clean up old kernel modules (be careful)
    if [ "$CLEAN_ALL" = true ]; then
        log_warn "Consider manually removing old kernel modules in /lib/modules/"
    fi

    log_success "Alpine-specific cleanup completed"
}

cleanup_container_runtime() {
    log_info "Cleaning up container runtime..."

    # Containerd (common in Alpine/K8s environments)
    if command -v ctr >/dev/null 2>&1; then
        log_info "Found containerd, cleaning unused images..."
        # List and remove unused images would need manual intervention
        log_warn "Run 'ctr images ls' to check containerd images"
    fi

    # Podman
    if command -v podman >/dev/null 2>&1; then
        run_cmd "podman system prune -f 2>/dev/null || true"
        if [ "$CLEAN_ALL" = true ]; then
            run_cmd "podman system prune -af --volumes 2>/dev/null || true"
        fi
    fi

    log_success "Container runtime cleanup completed"
}

show_large_files() {
    log_info "Top 10 largest directories in root:"

    # Use du compatible with busybox (Alpine)
    if [ "$OS_TYPE" = "alpine" ]; then
        $PRIV du -h -d 1 / 2>/dev/null | sort -hr | head -10 || true
    else
        $PRIV du -h --max-depth=1 / 2>/dev/null | sort -hr | head -10 || true
    fi

    echo ""
    log_info "Top 10 largest directories in /var:"

    if [ "$OS_TYPE" = "alpine" ]; then
        $PRIV du -h -d 1 /var 2>/dev/null | sort -hr | head -10 || true
    else
        $PRIV du -h --max-depth=1 /var 2>/dev/null | sort -hr | head -10 || true
    fi
}

show_disk_hogs() {
    log_info "Searching for large files (>100MB)..."
    run_priv_cmd "find / -type f -size +100M 2>/dev/null | head -20 || true"
}

#######################################
# Main
#######################################

main() {
    echo "============================================"
    echo "     Disk Cleanup Script (Alpine/Linux)"
    echo "============================================"
    echo ""

    log_info "Detected OS: $OS_TYPE"
    log_info "Privilege command: ${PRIV:-none}"

    if [ "$DRY_RUN" = true ]; then
        log_warn "Running in DRY-RUN mode - no changes will be made"
    fi
    echo ""

    log_info "Current disk usage: $(get_disk_usage)"
    echo ""

    # Run cleanup tasks
    cleanup_docker
    echo ""

    cleanup_container_runtime
    echo ""

    cleanup_package_cache
    echo ""

    cleanup_logs
    echo ""

    cleanup_tmp
    echo ""

    cleanup_npm_cache
    echo ""

    cleanup_git
    echo ""

    cleanup_user_cache
    echo ""

    cleanup_alpine_specific
    echo ""

    # Show results
    echo "============================================"
    log_info "Final disk usage: $(get_disk_usage)"
    echo "============================================"
    echo ""

    if [ "$CLEAN_ALL" = true ]; then
        show_large_files
        echo ""
        show_disk_hogs
    fi

    log_success "Disk cleanup completed!"

    if [ "$DRY_RUN" = true ]; then
        echo ""
        log_warn "This was a dry run. Run without --dry-run to actually clean."
    fi
}

main
