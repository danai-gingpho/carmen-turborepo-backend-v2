#!/bin/bash

# Carmen Turborepo Backend - Build All Script
# สคริปต์สำหรับ build ทุก package ใน apps/ directory

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

# ฟังก์ชันสำหรับ build แต่ละ microservice
build_microservice() {
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
    
    print_status "กำลัง build $service_name..."
    
    cd "$service_path"
    
    # Install dependencies ในทุก package เสมอ
    print_status "Installing dependencies สำหรับ $service_name..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
    
    # ตรวจสอบ script build
    if grep -q '"build"' package.json; then
        print_status "รัน build script สำหรับ $service_name..."
        if command -v bun &> /dev/null; then
            bun run build
        else
            npm run build
        fi
        
        if [ $? -eq 0 ]; then
            print_success "$service_name build สำเร็จ"
        else
            print_error "$service_name build ล้มเหลว"
            return 1
        fi
    else
        print_warning "$service_name ไม่มี build script ข้ามไป"
    fi
    
    cd - > /dev/null
}

# ฟังก์ชันหลัก
main() {
    echo "🚀 Carmen Turborepo Backend - Build All Script"
    echo "================================================"
    
    # ตรวจสอบว่าอยู่ใน root directory หรือไม่
    if [ ! -f "package.json" ] || [ ! -f "turbo.json" ]; then
        print_error "กรุณารันสคริปต์นี้จาก root directory ของโปรเจค"
        exit 1
    fi
    
    # ตรวจสอบ dependencies
    print_status "ตรวจสอบ dependencies..."
    if command -v bun &> /dev/null; then
        print_status "พบ Bun package manager"
        PACKAGE_MANAGER="bun"
    elif command -v npm &> /dev/null; then
        print_status "พบ npm package manager"
        PACKAGE_MANAGER="npm"
    else
        print_error "ไม่พบ package manager (bun หรือ npm)"
        exit 1
    fi
    
    # Install root dependencies ก่อนเสมอ
    print_status "Installing root dependencies..."
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install
    else
        npm install
    fi
    
    # Build shared packages ก่อน
    print_status "กำลัง build shared packages..."
    
    # Install dependencies ใน shared packages
    print_status "Installing dependencies ใน shared packages..."
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install
        bun run build:package
    else
        npm install
        npm run build:package
    fi
    
    # รายการ microservices ที่จะ build
    MICROSERVICES=(
        "micro-authen"
        "micro-cluster"
        "micro-file"
        "micro-license"
        "micro-notification"
        "micro-reports"
        "micro-tenant-inventory"
        "micro-tenant-master"
        "micro-tenant-procurement"
        "micro-tenant-recipe"
        "backend-gateway"
    )
    
    # Build แต่ละ microservice
    print_status "เริ่มต้น build microservices..."
    
    for service in "${MICROSERVICES[@]}"; do
        if ! build_microservice "$service"; then
            print_error "การ build $service ล้มเหลว"
            exit 1
        fi
    done
    
    # Build ด้วย Turborepo (optional)
    print_status "กำลัง build ด้วย Turborepo..."
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun run build
    else
        npm run build
    fi
    
    echo ""
    print_success "🎉 การ build ทุก package เสร็จสิ้นแล้ว!"
    echo ""
    print_status "สรุป:"
    echo "  - Shared packages: ✅"
    echo "  - Microservices: ✅"
    echo "  - Turborepo build: ✅"
    echo ""
    print_status "คุณสามารถรัน microservices ได้ด้วยคำสั่ง:"
    echo "  - bun run dev          # Development mode"
    echo "  - bun run dev:base     # Base services"
    echo "  - bun run dev:tenant   # Tenant services"
    echo "  - bun run prod:base    # Production base services"
}

# ฟังก์ชัน cleanup เมื่อมี error
cleanup() {
    print_error "เกิด error ระหว่างการ build"
    exit 1
}

# Set trap สำหรับ cleanup
trap cleanup ERR

# รันฟังก์ชันหลัก
main "$@"
