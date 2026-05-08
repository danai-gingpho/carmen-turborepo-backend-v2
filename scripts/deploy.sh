#!/bin/bash

# Carmen Backend V2 - Deployment Script
# Usage: ./deploy.sh [command] [service]
# Commands: pull, install, build, start, restart, stop, status
# Service: all, gateway, business, cluster, file, keycloak, notification, api-gateway-v2

SSH_KEY="$HOME/workspace/ssh/aws/webservice/webservice.pem"
SSH_HOST="ec2-user@43.209.126.252"
SSH_OPTS="-o StrictHostKeyChecking=no"
SSH_CMD="ssh -i $SSH_KEY $SSH_OPTS $SSH_HOST"

PROJECT_DIR="/home/ec2-user/carmen-turborepo-backend-v2"
BUN="/home/ec2-user/.bun/bin/bun"
NODE="/home/ec2-user/.nvm/versions/node/v24.14.0/bin/node"

declare -A SERVICE_MAP=(
  [gateway]="carmen-backend-gateway"
  [business]="carmen-micro-business"
  [cluster]="carmen-micro-cluster"
  [file]="carmen-micro-file"
  [keycloak]="carmen-micro-keycloak-api"
  [notification]="carmen-micro-notification"
  [api-gateway-v2]="api-gateway-v2"
)

ALL_SERVICES="gateway business cluster file keycloak notification"

get_service_name() {
  local key="$1"
  echo "${SERVICE_MAP[$key]}"
}

get_services() {
  local target="$1"
  if [[ "$target" == "all" || -z "$target" ]]; then
    echo "$ALL_SERVICES"
  else
    echo "$target"
  fi
}

cmd_pull() {
  echo "==> Pulling latest code from origin/main..."
  $SSH_CMD "cd $PROJECT_DIR && git pull origin main"
}

cmd_install() {
  echo "==> Installing dependencies..."
  $SSH_CMD "cd $PROJECT_DIR && $BUN install"
}

cmd_build() {
  echo "==> Building project..."
  $SSH_CMD "cd $PROJECT_DIR && PATH=\"\$(dirname $NODE):\$(dirname $BUN):\$PATH\" $BUN run build"
}

cmd_start() {
  local services=$(get_services "$1")
  for svc in $services; do
    local unit=$(get_service_name "$svc")
    if [[ -z "$unit" ]]; then
      echo "Unknown service: $svc"
      continue
    fi
    echo "==> Starting $unit..."
    $SSH_CMD "sudo systemctl start $unit.service"
  done
}

cmd_restart() {
  local services=$(get_services "$1")
  for svc in $services; do
    local unit=$(get_service_name "$svc")
    if [[ -z "$unit" ]]; then
      echo "Unknown service: $svc"
      continue
    fi
    echo "==> Restarting $unit..."
    $SSH_CMD "sudo systemctl restart $unit.service"
  done
}

cmd_stop() {
  local services=$(get_services "$1")
  for svc in $services; do
    local unit=$(get_service_name "$svc")
    if [[ -z "$unit" ]]; then
      echo "Unknown service: $svc"
      continue
    fi
    echo "==> Stopping $unit..."
    $SSH_CMD "sudo systemctl stop $unit.service"
  done
}

cmd_status() {
  local services=$(get_services "$1")
  for svc in $services; do
    local unit=$(get_service_name "$svc")
    if [[ -z "$unit" ]]; then
      echo "Unknown service: $svc"
      continue
    fi
    $SSH_CMD "systemctl status $unit.service --no-pager -l" 2>&1
    echo ""
  done
}

usage() {
  echo "Usage: ./deploy.sh [command] [service]"
  echo ""
  echo "Commands:"
  echo "  pull       - Pull latest code from origin/main"
  echo "  install    - Install dependencies (bun install)"
  echo "  build      - Build all packages and apps"
  echo "  start      - Start service(s)"
  echo "  restart    - Restart service(s)"
  echo "  stop       - Stop service(s)"
  echo "  status     - Show service status"
  echo ""
  echo "Services:"
  echo "  all (default)    - All NestJS services"
  echo "  gateway          - Backend Gateway"
  echo "  business         - Micro Business"
  echo "  cluster          - Micro Cluster"
  echo "  file             - Micro File"
  echo "  keycloak         - Micro Keycloak API"
  echo "  notification     - Micro Notification"
  echo "  api-gateway-v2   - API Gateway V2 (Go)"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh pull"
  echo "  ./deploy.sh build"
  echo "  ./deploy.sh restart all"
  echo "  ./deploy.sh stop gateway"
  echo "  ./deploy.sh status business"
}

COMMAND="$1"
SERVICE="${2:-all}"

case "$COMMAND" in
  pull)    cmd_pull ;;
  install) cmd_install ;;
  build)   cmd_build ;;
  start)   cmd_start "$SERVICE" ;;
  restart) cmd_restart "$SERVICE" ;;
  stop)    cmd_stop "$SERVICE" ;;
  status)  cmd_status "$SERVICE" ;;
  *)       usage ;;
esac
