#!/bin/bash

# PostgreSQL Backup Cron Setup Script

echo "⏰ PostgreSQL Backup Cron Setup"
echo "==============================="

# ตรวจสอบว่าอยู่ในโฟลเดอร์ที่ถูกต้อง
if [ ! -f "auto_backup.sh" ]; then
    echo "❌ ไม่พบไฟล์ auto_backup.sh"
    echo "กรุณารันสคริปต์นี้ในโฟลเดอร์ scripts/backup/"
    exit 1
fi

# ทำให้ไฟล์ executable
chmod +x auto_backup.sh

# ตั้งค่า default values
BACKUP_TIME=${1:-"02:00"}  # default เวลา 2:00 AM
BACKUP_FREQUENCY=${2:-"daily"}  # daily, weekly, monthly

# สร้าง cron expression ตาม frequency
case $BACKUP_FREQUENCY in
    "daily")
        CRON_EXPRESSION="0 2 * * *"
        DESCRIPTION="ทุกวันเวลา 2:00 AM"
        ;;
    "weekly")
        CRON_EXPRESSION="0 2 * * 0"
        DESCRIPTION="ทุกวันอาทิตย์เวลา 2:00 AM"
        ;;
    "monthly")
        CRON_EXPRESSION="0 2 1 * *"
        DESCRIPTION="ทุกวันที่ 1 ของเดือนเวลา 2:00 AM"
        ;;
    *)
        echo "❌ ความถี่ไม่ถูกต้อง: $BACKUP_FREQUENCY"
        echo "ใช้: daily, weekly, monthly"
        exit 1
        ;;
esac

# แสดงการตั้งค่า
echo "📅 การตั้งค่า Cron Job:"
echo "   ความถี่: $BACKUP_FREQUENCY ($DESCRIPTION)"
echo "   เวลา: $BACKUP_TIME"
echo "   สคริปต์: $(pwd)/auto_backup.sh"

# ถามยืนยัน
read -p "ยืนยันการตั้งค่า cron job? (yes/no): " confirm

if [[ $confirm =~ ^[Yy]$|^[Yy][Ee][Ss]$|^ใช่$ ]]; then
    # สร้าง cron job
    CRON_JOB="$CRON_EXPRESSION cd $(pwd) && ./auto_backup.sh >> backup.log 2>&1"
    
    # เพิ่ม cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ ตั้งค่า cron job สำเร็จ!"
        echo ""
        echo "📋 รายการ cron jobs ปัจจุบัน:"
        crontab -l
        echo ""
        echo "📝 Log file: $(pwd)/backup.log"
        echo "📁 Backup files: $(pwd)/backups/"
        echo ""
        echo "🔧 การจัดการ:"
        echo "  - ดู cron jobs: crontab -l"
        echo "  - แก้ไข cron jobs: crontab -e"
        echo "  - ลบ cron jobs: crontab -r"
        echo "  - ดู log: tail -f backup.log"
    else
        echo "❌ ไม่สามารถตั้งค่า cron job ได้"
        exit 1
    fi
else
    echo "❌ ยกเลิกการตั้งค่า"
    exit 1
fi 