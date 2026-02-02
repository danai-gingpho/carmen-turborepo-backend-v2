#!/bin/bash

# Carmen Turborepo Backend - Run All Packages Script (macOS/Linux)
# สคริปต์สำหรับรันทุก package ใน apps/ directory ใน terminal แยกกัน

set -e  # หยุดการทำงานทันทีหากมี error

# กำหนดสีสำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ฟังก์ชันสำหรับแสดงข้อความ
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

# ฟังก์ชันสำหรับเปิด terminal และรัน service
run_service_in_terminal() {
    local service_name=$1
    local service_path="apps/$service_name"
    
    if [ ! -d "$service_path" ]; then
        print_warning "Directory $service_path ไม่มีอยู่ ข้ามไป"
        return 0
    fi
    
    if [ ! -f "$service_path/package.json" ]; then
        print_warning "ไม่พบ package.json ใน $service_path ข้ามไป"
        return 0
    fi
    
    print_status "เปิด terminal สำหรับ $service_name..."
    
    # ตรวจสอบ OS และใช้คำสั่งที่เหมาะสม
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "
        tell application \"Terminal\"
            do script \"cd '$PWD/$service_path' && echo '[INFO] กำลังรัน $service_name...' && echo '[INFO] Directory: $PWD/$service_path' && echo '[INFO] รันคำสั่ง: bun run dev' && echo '' && bun run dev\"
        end tell
        "
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$service_name - Carmen Backend" -- bash -c "cd '$PWD/$service_path' && echo '[INFO] กำลังรัน $service_name...' && echo '[INFO] Directory: $PWD/$service_path' && echo '[INFO] รันคำสั่ง: bun run dev' && echo '' && bun run dev; exec bash"
        elif command -v konsole &> /dev/null; then
            konsole --title "$service_name - Carmen Backend" -e bash -c "cd '$PWD/$service_path' && echo '[INFO] กำลังรัน $service_name...' && echo '[INFO] Directory: $PWD/$service_path' && echo '[INFO] รันคำสั่ง: bun run dev' && echo '' && bun run dev; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$service_name - Carmen Backend" -e bash -c "cd '$PWD/$service_path' && echo '[INFO] กำลังรัน $service_name...' && echo '[INFO] Directory: $PWD/$service_path' && echo '[INFO] รันคำสั่ง: bun run dev' && echo '' && bun run dev; exec bash" &
        else
            print_error "ไม่พบ terminal emulator ที่รองรับ (gnome-terminal, konsole, xterm)"
            return 1
        fi
    else
        print_error "ไม่รองรับ OS type: $OSTYPE"
        return 1
    fi
    
    # รอสักครู่ก่อนเปิด terminal ถัดไป
    sleep 1
}

# ฟังก์ชันหลัก
main() {
    echo "🚀 Carmen Turborepo Backend - Run All Packages Script"
    echo "====================================================="
    
    # ตรวจสอบว่าอยู่ใน root directory หรือไม่
    if [ ! -f "package.json" ] || [ ! -f "turbo.json" ]; then
        print_error "กรุณารันสคริปต์นี้จาก root directory ของโปรเจค"
        exit 1
    fi
    
    # รายการ microservices ที่จะรัน
    MICROSERVICES=(
        "micro-authen"
        "micro-keycloak-api"
        "micro-cluster"
        "micro-cronjob"
        "micro-file"
        "micro-license"
        "micro-log"
        "micro-notification"
        "micro-reports"
        "micro-tenant-inventory"
        "micro-tenant-master"
        "micro-tenant-procurement"
        "micro-tenant-recipe"
        "backend-gateway"
    )
    
    print_status "กำลังเปิด terminal สำหรับแต่ละ package..."
    echo
    
    # รันแต่ละ microservice ใน terminal แยกกัน
    for service in "${MICROSERVICES[@]}"; do
        if ! run_service_in_terminal "$service"; then
            print_error "การเปิด terminal สำหรับ $service ล้มเหลว"
            exit 1
        fi
    done
    
    echo
    print_success "🎉 เปิด terminal สำหรับทุก package แล้ว!"
    echo
    print_status "สรุป:"
    echo "  - Microservices: ✅"
    echo "  - Backend Gateway: ✅"
    echo
    print_status "แต่ละ terminal จะรันคำสั่ง 'bun run dev' โดยอัตโนมัติ"
    print_status "ปิด terminal เพื่อหยุดการทำงานของ service นั้น"
    echo
    print_status "คุณสามารถรันคำสั่งอื่นๆ ได้ด้วย:"
    echo "  - bun run dev:base     # Base services"
    echo "  - bun run dev:tenant   # Tenant services"
    echo "  - bun run prod:base    # Production base services"
}

# ฟังก์ชัน cleanup เมื่อมี error
cleanup() {
    print_error "เกิด error ระหว่างการรันสคริปต์"
    exit 1
}

# Set trap สำหรับ cleanup
trap cleanup ERR

# รันฟังก์ชันหลัก
main "$@"
