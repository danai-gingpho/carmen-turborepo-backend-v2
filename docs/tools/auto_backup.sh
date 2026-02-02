#!/bin/bash

# PostgreSQL Auto Backup Script
# ใช้สำหรับ cron job หรือ automation

# โหลด environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# ตั้งค่า default values
DATABASE_HOST=${DATABASE_HOST:-localhost}
DATABASE_PORT=${DATABASE_PORT:-5432}
DATABASE_NAME=${DATABASE_NAME:-postgres}
DATABASE_USER=${DATABASE_USER:-postgres}
DATABASE_PASSWORD=${DATABASE_PASSWORD:-}
DATABASE_SCHEMA=${DATABASE_SCHEMA:-public}

# ตั้งค่า backup
BACKUP_TYPE=${BACKUP_TYPE:-full}  # full, schema_only, data_only
BACKUP_DIR=${BACKUP_DIR:-backups}
MAX_DAYS=${BACKUP_MAX_DAYS:-30}
MAX_SIZE_MB=${BACKUP_MAX_SIZE_MB:-1000}
KEEP_MINIMUM=${BACKUP_KEEP_MINIMUM:-5}

# สร้างโฟลเดอร์ backup
mkdir -p "$BACKUP_DIR"

# สร้างชื่อไฟล์ backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DATABASE_NAME}_${DATABASE_SCHEMA}_${TIMESTAMP}.sql"

# ฟังก์ชัน log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# ฟังก์ชัน cleanup ไฟล์เก่า
cleanup_old_backups() {
    log "🧹 เริ่ม cleanup ไฟล์ backup เก่า..."
    
    # ลบไฟล์ที่เก่ากว่า MAX_DAYS วัน
    find "$BACKUP_DIR" -name "*.sql" -mtime +$MAX_DAYS -delete 2>/dev/null
    
    # ตรวจสอบขนาดรวม
    TOTAL_SIZE=$(du -sm "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
    
    if [ "$TOTAL_SIZE" -gt "$MAX_SIZE_MB" ]; then
        log "📏 ขนาดรวมเกิน $MAX_SIZE_MB MB, ลบไฟล์เก่า..."
        
        # ลบไฟล์เก่าจนกว่าขนาดจะอยู่ในขีดจำกัด
        ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +$((KEEP_MINIMUM + 1)) | xargs -r rm
        
        log "✅ Cleanup เสร็จสิ้น"
    else
        log "✅ ขนาดรวมอยู่ในขีดจำกัด ($TOTAL_SIZE MB)"
    fi
}

# ฟังก์ชัน backup
run_backup() {
    log "🔄 เริ่ม backup..."
    log "   Database: $DATABASE_NAME"
    log "   Schema: $DATABASE_SCHEMA"
    log "   Type: $BACKUP_TYPE"
    log "   Output: $BACKUP_FILE"
    
    # สร้าง pg_dump command
    CMD="pg_dump --verbose --host=$DATABASE_HOST --port=$DATABASE_PORT --username=$DATABASE_USER --dbname=$DATABASE_NAME --file=$BACKUP_FILE --format=plain --encoding=UTF8"
    
    # เพิ่ม options ตาม backup type
    case $BACKUP_TYPE in
        "schema_only")
            CMD="$CMD --schema-only"
            ;;
        "data_only")
            CMD="$CMD --data-only"
            ;;
        "full")
            # default คือ full backup
            ;;
        *)
            log "❌ ประเภท backup ไม่ถูกต้อง: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # เพิ่ม schema ถ้ามี
    if [ "$DATABASE_SCHEMA" != "public" ]; then
        CMD="$CMD --schema=$DATABASE_SCHEMA"
    fi
    
    # รัน backup
    if [ -n "$DATABASE_PASSWORD" ]; then
        PGPASSWORD="$DATABASE_PASSWORD" $CMD
    else
        $CMD
    fi
    
    if [ $? -eq 0 ]; then
        log "✅ Backup สำเร็จ!"
        
        # แสดงขนาดไฟล์
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "📁 ไฟล์: $BACKUP_FILE ($FILE_SIZE)"
        
        return 0
    else
        log "❌ Backup ล้มเหลว!"
        return 1
    fi
}

# ฟังก์ชันตรวจสอบการเชื่อมต่อ
check_connection() {
    log "🔍 ตรวจสอบการเชื่อมต่อฐานข้อมูล..."
    
    if [ -n "$DATABASE_PASSWORD" ]; then
        PGPASSWORD="$DATABASE_PASSWORD" psql --host="$DATABASE_HOST" --port="$DATABASE_PORT" --username="$DATABASE_USER" --dbname="$DATABASE_NAME" --command="SELECT 1;" >/dev/null 2>&1
    else
        psql --host="$DATABASE_HOST" --port="$DATABASE_PORT" --username="$DATABASE_USER" --dbname="$DATABASE_NAME" --command="SELECT 1;" >/dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        log "✅ การเชื่อมต่อสำเร็จ"
        return 0
    else
        log "❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้"
        return 1
    fi
}

# ฟังก์ชันหลัก
main() {
    log "🐘 PostgreSQL Auto Backup เริ่มต้น"
    
    # ตรวจสอบการเชื่อมต่อ
    if ! check_connection; then
        log "❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้"
        exit 1
    fi
    
    # รัน backup
    if run_backup; then
        # cleanup ไฟล์เก่า
        cleanup_old_backups
        
        log "🎉 Auto backup เสร็จสิ้น!"
        exit 0
    else
        log "❌ Auto backup ล้มเหลว!"
        exit 1
    fi
}

# รันฟังก์ชันหลัก
main "$@" 