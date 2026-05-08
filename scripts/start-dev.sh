#!/bin/sh
# carmen.sh — จัดการ Carmen Backend V2 (รัน bun โดยตรง ไม่ใช้ Docker)
#
# Usage:
#   ./carmen.sh install                     Install dependencies + build packages
#   ./carmen.sh start [core|all|SERVICE]    Start services (background)
#   ./carmen.sh stop  [core|all|SERVICE]    Stop services
#   ./carmen.sh restart [core|all|SERVICE]  Restart services
#   ./carmen.sh logs [SERVICE]              ดู logs
#   ./carmen.sh status                      ดู status ทุก service
#   ./carmen.sh health                      เช็ค health
#
# ตัวอย่าง:
#   ./carmen.sh install                     ติดตั้ง dependencies ครั้งแรก
#   ./carmen.sh start core                  Start 4 core services
#   ./carmen.sh stop core                   Stop ทั้งหมด
#   ./carmen.sh restart gateway             Restart เฉพาะ gateway
#   ./carmen.sh logs business               ดู logs business

set -e

# Project root (resolve symlinks so running via /usr/local/bin/start-dev works)
SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || echo "$0")"
ROOT_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"
PID_DIR="$ROOT_DIR/.carmen/pids"
LOG_DIR="$ROOT_DIR/.carmen/logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

# Service definitions: name|dir|start_command|type
# type: node (default), bun, go, dotnet
# ใช้ build+node เพื่อประหยัด RAM (ไม่ใช้ ts-node-dev/watch)
# Gateway: try dist/main first, fallback to dist/src/main (build output varies by environment)
GATEWAY_ENTRY="dist/main"
[ ! -f "apps/backend-gateway/dist/main.js" ] && [ -f "apps/backend-gateway/dist/src/main.js" ] && GATEWAY_ENTRY="dist/src/main"
SERVICE_GATEWAY="gateway|apps/backend-gateway|node ${GATEWAY_ENTRY}|node"
SERVICE_BUSINESS="business|apps/micro-business|node dist/main|node"
SERVICE_CLUSTER="cluster|apps/micro-cluster|node dist/main|node"
SERVICE_KEYCLOAK="keycloak|apps/micro-keycloak-api|node dist/main|node"
SERVICE_FILE="file|apps/micro-file|node dist/main|node"
SERVICE_NOTIFICATION="notification|apps/micro-notification|node dist/main|node"

# External services (outside monorepo)
CARMEN_DEV_DIR="$HOME"
SERVICE_REPORT="report|$CARMEN_DEV_DIR/micro-report|./bin/micro-report|go"
SERVICE_CRONJOB="cronjob|$CARMEN_DEV_DIR/micro-cronjobs|./bin/micro-cronjob|go"
CORE_LIST="gateway business cluster keycloak"
ALL_LIST="gateway business cluster keycloak file notification report cronjob"

# ───────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────

get_service_def() {
    case "$1" in
        gateway)        echo "$SERVICE_GATEWAY" ;;
        business)       echo "$SERVICE_BUSINESS" ;;
        cluster)        echo "$SERVICE_CLUSTER" ;;
        keycloak)       echo "$SERVICE_KEYCLOAK" ;;
        file)           echo "$SERVICE_FILE" ;;
        notification)   echo "$SERVICE_NOTIFICATION" ;;
        report)         echo "$SERVICE_REPORT" ;;
        cronjob)        echo "$SERVICE_CRONJOB" ;;
        *) echo "" ;;
    esac
}

get_field() {
    # get_field "name|dir|cmd|type" field_number
    echo "$1" | cut -d'|' -f"$2"
}

resolve_dir() {
    # External services use absolute paths, internal use $ROOT_DIR prefix
    dir="$1"
    case "$dir" in
        /*) echo "$dir" ;;
        *)  echo "$ROOT_DIR/$dir" ;;
    esac
}

resolve_services() {
    case "${1:-core}" in
        core) echo "$CORE_LIST" ;;
        all)  echo "$ALL_LIST" ;;
        *)    echo "$1" ;;
    esac
}

is_running() {
    name="$1"
    pid_file="$PID_DIR/$name.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
        rm -f "$pid_file"
    fi
    return 1
}

get_ports() {
    case "$1" in
        gateway)        echo "4000 4001" ;;
        business)       echo "5020 6020" ;;
        cluster)        echo "5014 6014" ;;
        keycloak)       echo "5013 6013" ;;
        file)           echo "5007 6007" ;;
        notification)   echo "5006 6006" ;;
        report)         echo "5015 6015" ;;
        cronjob)        echo "6016" ;;
        *)              echo "" ;;
    esac
}

kill_port_holders() {
    for port in $1; do
        # ใช้ ss เพราะ lsof/fuser ไม่ทำงานบน Alpine
        pids=$(ss -tlnp "sport = :$port" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | sort -u)
        if [ -n "$pids" ]; then
            echo "    killing stale process on port $port (PIDs: $pids)"
            for p in $pids; do
                kill -9 "$p" 2>/dev/null || true
            done
        fi
    done
}

# ───────────────────────────────────────────────────────────
# Commands
# ───────────────────────────────────────────────────────────

cmd_install() {
    echo "=== Installing dependencies ==="
    cd "$ROOT_DIR"

    echo ""
    echo "--- bun install ---"
    bun install

    echo ""
    echo "--- Generating Prisma clients ---"
    bun run db:generate

    echo ""
    echo "--- Building shared packages ---"
    bun run build:package

    echo ""
    echo "=== Install complete ==="
}

cmd_build() {
    services=$(resolve_services "$1")
    echo "=== Building services ==="

    for name in $services; do
        def=$(get_service_def "$name")
        if [ -z "$def" ]; then
            echo "Unknown service: $name"
            continue
        fi
        dir=$(resolve_dir "$(get_field "$def" 2)")
        svc_type=$(get_field "$def" 4)

        echo ""
        echo "--- Building: $name ---"
        cd "$dir"
        case "$svc_type" in
            bun)    bun build src/server.ts --outdir=dist --target=bun ;;
            go)
                bin_path=$(get_field "$def" 3)
                CGO_ENABLED=0 go build -o "$bin_path" ./cmd/server
                ;;
            *)      npx nest build ;;
        esac
    done

    cd "$ROOT_DIR"
    echo ""
    echo "=== Build complete ==="
}

cmd_start() {
    services=$(resolve_services "$1")
    echo "=== Starting services ==="

    for name in $services; do
        def=$(get_service_def "$name")
        if [ -z "$def" ]; then
            echo "Unknown service: $name"
            continue
        fi

        if is_running "$name"; then
            pid=$(cat "$PID_DIR/$name.pid")
            echo "  $name: already running (PID $pid)"
            continue
        fi

        dir=$(resolve_dir "$(get_field "$def" 2)")
        cmd=$(get_field "$def" 3)
        svc_type=$(get_field "$def" 4)

        # เช็คว่า directory มีจริง
        if [ ! -d "$dir" ]; then
            echo "  $name: directory not found ($dir), skipping"
            continue
        fi

        # เช็คว่า build แล้วยัง (เฉพาะ node/bun)
        case "$svc_type" in
            bun)
                if [ ! -f "$dir/dist/server.js" ]; then
                    echo "  $name: not built yet, building..."
                    cd "$dir"
                    bun build src/server.ts --outdir=dist --target=bun
                fi
                ;;
            go|dotnet)
                # go run / dotnet run จะ compile เอง
                ;;
            *)
                if [ ! -d "$dir/dist" ]; then
                    echo "  $name: not built yet, building..."
                    cd "$dir"
                    npx nest build
                fi
                ;;
        esac

        cd "$dir"
        nohup $cmd >> "$LOG_DIR/$name.log" 2>&1 &
        echo $! > "$PID_DIR/$name.pid"
        echo "  $name: started (PID $!)"
    done

    cd "$ROOT_DIR"
    echo ""
    echo "=== Done ==="
}

cmd_stop() {
    services=$(resolve_services "$1")
    echo "=== Stopping services ==="

    for name in $services; do
        pid_file="$PID_DIR/$name.pid"
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                # kill process tree (child processes ด้วย)
                kill -- -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
                # รอให้ process จบ (max 5 วินาที)
                i=0
                while kill -0 "$pid" 2>/dev/null && [ $i -lt 10 ]; do
                    sleep 0.5
                    i=$((i + 1))
                done
                # ถ้ายังไม่จบ force kill
                if kill -0 "$pid" 2>/dev/null; then
                    kill -9 -- -"$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
                fi
                echo "  $name: stopped (PID $pid)"
            else
                echo "  $name: not running"
            fi
            rm -f "$pid_file"
        else
            echo "  $name: not running"
        fi

        # kill process ที่ยังค้างอยู่บน port
        ports=$(get_ports "$name")
        if [ -n "$ports" ]; then
            kill_port_holders "$ports"
        fi
    done

    echo ""
    echo "=== Done ==="
}

cmd_restart() {
    services=$(resolve_services "$1")
    cmd_stop "$1"
    echo ""
    # clear logs ก่อน start ใหม่
    for name in $services; do
        rm -f "$LOG_DIR/$name.log"
    done
    echo "  logs cleared"
    echo ""
    cmd_start "$1"
}

cmd_logs() {
    name="${1:-all}"
    if [ "$name" = "all" ]; then
        echo "=== Tailing all logs ==="
        tail -f "$LOG_DIR"/*.log
    else
        log_file="$LOG_DIR/$name.log"
        if [ -f "$log_file" ]; then
            tail -f "$log_file"
        else
            echo "No log file for: $name"
            echo "Available: $(ls "$LOG_DIR"/*.log 2>/dev/null | xargs -I{} basename {} .log | tr '\n' ' ')"
        fi
    fi
}

cmd_status() {
    echo "=== Service Status ==="
    echo ""
    printf "%-15s %-10s %-10s %s\n" "SERVICE" "STATUS" "PID" "PORTS"
    printf "%-15s %-10s %-10s %s\n" "-------" "------" "---" "-----"

    for name in $ALL_LIST; do
        pid="-"
        status="STOPPED"
        ports="-"

        if is_running "$name"; then
            pid=$(cat "$PID_DIR/$name.pid")
            status="RUNNING"
        fi

        case "$name" in
            gateway)        ports="4000, 4001" ;;
            business)       ports="5020, 6020" ;;
            cluster)        ports="5014, 6014" ;;
            keycloak)       ports="5013, 6013" ;;
            file)           ports="5007, 6007" ;;
            notification)   ports="5006, 6006" ;;
            report)         ports="5015, 6015" ;;
            cronjob)        ports="6016" ;;
        esac

        printf "%-15s %-10s %-10s %s\n" "$name" "$status" "$pid" "$ports"
    done
}

cmd_health() {
    echo "=== Health Check ==="
    echo ""

    check() {
        printf "  %-20s " "$1:"
        if wget -qO/dev/null --timeout=3 "$2" 2>/dev/null; then
            echo "OK"
        else
            echo "UNREACHABLE"
        fi
    }

    check "Gateway (4000)"        "http://localhost:4000/health"
    check "Business (6020)"       "http://localhost:6020/health"
    check "Cluster (6014)"        "http://localhost:6014/health"
    check "Keycloak API (6013)"   "http://localhost:6013/health"
    check "File (6007)"           "http://localhost:6007/health"
    check "Notification (6006)"   "http://localhost:6006/health"
    check "Report (6015)"         "http://localhost:6015/health"
    check "Cronjob (6016)"        "http://localhost:6016/health"
}

cmd_clean_logs() {
    echo "=== Cleaning logs ==="
    rm -f "$LOG_DIR"/*.log
    echo "Done"
}

cmd_help() {
    echo "Carmen Backend V2 — Service Management (no Docker)"
    echo ""
    echo "Usage: ./carmen.sh <command> [target]"
    echo ""
    echo "Commands:"
    echo "  install                         bun install + build packages + prisma generate"
    echo "  build   [core|all|SERVICE]      Build services (nest build / bun build)"
    echo "  start   [core|all|SERVICE]      Start services (background)"
    echo "  stop    [core|all|SERVICE]      Stop services"
    echo "  restart [core|all|SERVICE]      Restart services"
    echo "  logs    [SERVICE|all]           ดู logs (tail -f)"
    echo "  status                          ดู status ทุก service"
    echo "  health                          เช็ค health endpoints"
    echo "  clean-logs                      ลบ log files"
    echo ""
    echo "Targets:"
    echo "  core           gateway, business, cluster, keycloak (default, 4 services)"
    echo "  all            ทุก 7 services"
    echo "  SERVICE name   gateway | business | cluster | keycloak | file | notification | report | cronjob"
    echo ""
    echo "ตัวอย่าง:"
    echo "  ./carmen.sh install             # ครั้งแรก"
    echo "  ./carmen.sh build core          # Build 4 core services"
    echo "  ./carmen.sh start core          # Start 4 core services"
    echo "  ./carmen.sh stop all            # Stop ทั้งหมด"
    echo "  ./carmen.sh restart business    # Restart เฉพาะ business"
    echo "  ./carmen.sh logs gateway        # ดู logs gateway"
    echo "  ./carmen.sh status              # ดู status"
    echo ""
    echo "Logs:  $LOG_DIR/"
    echo "PIDs:  $PID_DIR/"
}

# ───────────────────────────────────────────────────────────
# Main
# ───────────────────────────────────────────────────────────

case "${1:-help}" in
    install)    cmd_install ;;
    build)      cmd_build "$2" ;;
    start)      cmd_start "$2" ;;
    stop)       cmd_stop "$2" ;;
    restart)    cmd_restart "$2" ;;
    logs)       cmd_logs "$2" ;;
    status)     cmd_status ;;
    health)     cmd_health ;;
    clean-logs) cmd_clean_logs ;;
    help|*)     cmd_help ;;
esac
