#!/bin/sh
# start-uat.sh — จัดการ Carmen Backend V2 บน UAT Server (remote via SSH)
#
# Usage:
#   ./start-uat.sh install                     Install dependencies + build packages
#   ./start-uat.sh build  [core|all|SERVICE]   Build services
#   ./start-uat.sh start  [core|all|SERVICE]   Start services (background)
#   ./start-uat.sh stop   [core|all|SERVICE]   Stop services
#   ./start-uat.sh restart [core|all|SERVICE]  Restart services
#   ./start-uat.sh logs   [SERVICE]            ดู logs
#   ./start-uat.sh status                      ดู status ทุก service
#   ./start-uat.sh health                      เช็ค health
#   ./start-uat.sh deploy [core|all|SERVICE]   Stop → git pull → install → build → start
#   ./start-uat.sh ssh                         เปิด SSH session
#
# ตัวอย่าง:
#   ./start-uat.sh install                     ติดตั้ง dependencies ครั้งแรก
#   ./start-uat.sh start core                  Start 4 core services
#   ./start-uat.sh stop all                    Stop ทั้งหมด
#   ./start-uat.sh restart gateway             Restart เฉพาะ gateway
#   ./start-uat.sh logs business               ดู logs business
#   ./start-uat.sh deploy core                 Deploy ล่าสุดแล้ว restart core

set -e

# ───────────────────────────────────────────────────────────
# UAT Server SSH Configuration
# ───────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SSH_KEY="$SCRIPT_DIR/../../ssh/aws/script/ec2-webservice-bkk.pem"
SSH_USER="ec2-user"
SSH_HOST="43.209.126.252"
REMOTE_DIR="/home/ec2-user/carmen-turborepo-backend-v2"
REMOTE_SCRIPT="scripts/start-dev.sh"

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10"
SSH_CMD="ssh $SSH_OPTS $SSH_USER@$SSH_HOST"

CORE_LIST="gateway business cluster keycloak"
ALL_LIST="gateway business cluster keycloak file notification"

# ───────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────

remote_exec() {
    $SSH_CMD "source ~/.bash_profile 2>/dev/null; cd $REMOTE_DIR && $1"
}

check_connection() {
    printf "Connecting to UAT server (%s)... " "$SSH_HOST"
    if $SSH_CMD "echo ok" >/dev/null 2>&1; then
        echo "connected"
    else
        echo "FAILED"
        echo "Cannot connect to $SSH_USER@$SSH_HOST"
        echo "Check SSH key: $SSH_KEY"
        exit 1
    fi
}

resolve_services() {
    case "${1:-core}" in
        core) echo "$CORE_LIST" ;;
        all)  echo "$ALL_LIST" ;;
        *)    echo "$1" ;;
    esac
}

resolve_app_dir() {
    case "$1" in
        gateway) echo "apps/backend-gateway" ;;
        *)       echo "apps/micro-$1" ;;
    esac
}

# ───────────────────────────────────────────────────────────
# Commands
# ───────────────────────────────────────────────────────────

cmd_install() {
    echo "=== [UAT] Installing dependencies ==="
    remote_exec "bash $REMOTE_SCRIPT install"
}

cmd_build() {
    target="${1:-core}"
    echo "=== [UAT] Building services: $target ==="

    # Build ทีละตัวเพื่อประหยัด RAM (server มี 1.8GB)
    services=$(resolve_services "$target")
    for name in $services; do
        echo ""
        echo "--- [UAT] Building: $name ---"
        app_dir=$(resolve_app_dir "$name")
        remote_exec "export NODE_OPTIONS='--max-old-space-size=1024' && cd $app_dir && npx nest build"
        echo "  $name: built"
    done

    echo ""
    echo "=== [UAT] Build complete ==="
}

cmd_start() {
    target="${1:-core}"
    echo "=== [UAT] Starting services: $target ==="
    remote_exec "bash $REMOTE_SCRIPT start $target"
}

cmd_stop() {
    target="${1:-core}"
    echo "=== [UAT] Stopping services: $target ==="
    remote_exec "bash $REMOTE_SCRIPT stop $target"
}

cmd_restart() {
    target="${1:-core}"
    echo "=== [UAT] Restarting services: $target ==="
    remote_exec "bash $REMOTE_SCRIPT restart $target"
}

cmd_logs() {
    name="${1:-all}"
    echo "=== [UAT] Logs: $name (Ctrl+C to exit) ==="
    if [ "$name" = "all" ]; then
        $SSH_CMD "tail -f $REMOTE_DIR/.carmen/logs/*.log"
    else
        $SSH_CMD "tail -f $REMOTE_DIR/.carmen/logs/$name.log"
    fi
}

cmd_status() {
    remote_exec "bash $REMOTE_SCRIPT status"
}

cmd_health() {
    remote_exec "bash $REMOTE_SCRIPT health"
}

cmd_clean_logs() {
    echo "=== [UAT] Cleaning logs ==="
    remote_exec "bash $REMOTE_SCRIPT clean-logs"
}

cmd_deploy() {
    target="${1:-core}"
    echo "=== [UAT] Deploying: $target ==="

    echo ""
    echo "--- [UAT] Stopping services ---"
    remote_exec "bash $REMOTE_SCRIPT stop $target"

    echo ""
    echo "--- [UAT] Pulling latest code ---"
    remote_exec "git pull"

    echo ""
    echo "--- [UAT] Installing dependencies ---"
    remote_exec "bash $REMOTE_SCRIPT install"

    echo ""
    echo "--- [UAT] Building services ---"
    cmd_build "$target"

    echo ""
    echo "--- [UAT] Starting services ---"
    remote_exec "bash $REMOTE_SCRIPT start $target"

    echo ""
    echo "--- [UAT] Health check (waiting 8s) ---"
    sleep 8
    remote_exec "bash $REMOTE_SCRIPT health"

    echo ""
    echo "=== [UAT] Deploy complete ==="
}

cmd_ssh() {
    echo "=== [UAT] Opening SSH session ==="
    $SSH_CMD
}

cmd_help() {
    echo "Carmen Backend V2 — UAT Remote Management"
    echo ""
    echo "Server: $SSH_USER@$SSH_HOST"
    echo "Path:   $REMOTE_DIR"
    echo ""
    echo "Usage: ./start-uat.sh <command> [target]"
    echo ""
    echo "Commands:"
    echo "  install                         bun install + build packages + prisma generate"
    echo "  build   [core|all|SERVICE]      Build services (ทีละตัว ประหยัด RAM)"
    echo "  start   [core|all|SERVICE]      Start services (background)"
    echo "  stop    [core|all|SERVICE]      Stop services"
    echo "  restart [core|all|SERVICE]      Restart services"
    echo "  deploy  [core|all|SERVICE]      Stop → pull → install → build → start"
    echo "  logs    [SERVICE|all]           ดู logs (tail -f)"
    echo "  status                          ดู status ทุก service"
    echo "  health                          เช็ค health endpoints"
    echo "  clean-logs                      ลบ log files"
    echo "  ssh                             เปิด SSH session ไป UAT server"
    echo ""
    echo "Targets:"
    echo "  core           gateway, business, cluster, keycloak (default)"
    echo "  all            ทุก 6 services"
    echo "  SERVICE name   gateway | business | cluster | keycloak | file | notification"
    echo ""
    echo "ตัวอย่าง:"
    echo "  ./start-uat.sh deploy core      # Deploy + restart core services"
    echo "  ./start-uat.sh restart business  # Restart เฉพาะ business"
    echo "  ./start-uat.sh logs gateway      # ดู logs gateway"
    echo "  ./start-uat.sh status            # ดู status ทุก service"
    echo "  ./start-uat.sh ssh               # SSH เข้า UAT server"
}

# ───────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────

case "${1:-help}" in
    install)    check_connection; cmd_install ;;
    build)      check_connection; cmd_build "$2" ;;
    start)      check_connection; cmd_start "${2:-core}" ;;
    stop)       check_connection; cmd_stop "${2:-core}" ;;
    restart)    check_connection; cmd_restart "${2:-core}" ;;
    deploy)     check_connection; cmd_deploy "${2:-core}" ;;
    logs)       check_connection; cmd_logs "${2:-all}" ;;
    status)     check_connection; cmd_status ;;
    health)     check_connection; cmd_health ;;
    clean-logs) check_connection; cmd_clean_logs ;;
    ssh)        cmd_ssh ;;
    help|*)     cmd_help ;;
esac
