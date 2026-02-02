#!/bin/bash

# PostgreSQL Backup Tools Setup Script

echo "🐘 PostgreSQL Backup Tools Setup"
echo "================================"

# ตรวจสอบ Python
if ! command -v python3 &> /dev/null; then
    echo "❌ ไม่พบ Python 3"
    echo "กรุณาติดตั้ง Python 3 ก่อน"
    exit 1
fi

echo "✅ พบ Python 3: $(python3 --version)"

# ตรวจสอบ pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ ไม่พบ pip3"
    echo "กรุณาติดตั้ง pip3 ก่อน"
    exit 1
fi

echo "✅ พบ pip3"

# ติดตั้ง dependencies
echo "📦 ติดตั้ง dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ ติดตั้ง dependencies สำเร็จ"
else
    echo "❌ ติดตั้ง dependencies ล้มเหลว"
    exit 1
fi

# ตรวจสอบ PostgreSQL client tools
if ! command -v pg_dump &> /dev/null; then
    echo "⚠️  ไม่พบ pg_dump"
    echo "กรุณาติดตั้ง PostgreSQL client tools:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    echo "  Windows: ดาวน์โหลดจาก https://www.postgresql.org/download/windows/"
else
    echo "✅ พบ pg_dump"
fi

# สร้างไฟล์ .env ถ้ายังไม่มี
if [ ! -f .env ]; then
    echo "📝 สร้างไฟล์ .env..."
    cp env.example .env
    echo "✅ สร้างไฟล์ .env สำเร็จ"
    echo "⚠️  กรุณาแก้ไขไฟล์ .env ให้ตรงกับการตั้งค่าฐานข้อมูลของคุณ"
else
    echo "✅ ไฟล์ .env มีอยู่แล้ว"
fi

# สร้างโฟลเดอร์ backups
mkdir -p backups
echo "✅ สร้างโฟลเดอร์ backups/"

echo ""
echo "🎉 การติดตั้งเสร็จสิ้น!"
echo ""
echo "📖 วิธีการใช้งาน:"
echo "  1. แก้ไขไฟล์ .env ให้ตรงกับการตั้งค่าฐานข้อมูล"
echo "  2. รัน backup: python3 backup_postgres.py"
echo "  3. รัน restore: python3 restore_postgres.py"
echo "  4. ลบไฟล์เก่า: python3 cleanup_backups.py"
echo ""
echo "📚 ดูรายละเอียดเพิ่มเติมได้ที่ README_backup.md" 