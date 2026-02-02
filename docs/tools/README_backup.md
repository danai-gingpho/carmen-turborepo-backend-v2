# PostgreSQL Backup Script

สคริปต์ Python สำหรับ backup ฐานข้อมูล PostgreSQL โดยใช้ไฟล์ .env

## การติดตั้ง

1. **ติดตั้ง dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **สร้างไฟล์ .env:**
   ```bash
   cp env.example .env
   ```

3. **แก้ไขไฟล์ .env:**
   ```bash
   # PostgreSQL Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=your_database_name
   DATABASE_USER=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_SCHEMA=your_schema_name
   ```

## การใช้งาน

### 1. รันสคริปต์
```bash
python backup_postgres.py
```

### 2. เลือกประเภท backup
- **1. Full backup** - backup ทั้ง schema และ data
- **2. Schema only** - backup เฉพาะ schema
- **3. Data only** - backup เฉพาะ data

### 3. ผลลัพธ์
ไฟล์ backup จะถูกสร้างในโฟลเดอร์ `backups/` ด้วยชื่อไฟล์:
```
database_schema_YYYYMMDD_HHMMSS.sql
```

## ตัวอย่างการตั้งค่า

### สำหรับ Local PostgreSQL
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp
DATABASE_USER=postgres
DATABASE_PASSWORD=mypassword
DATABASE_SCHEMA=public
```

### สำหรับ Supabase
```env
DATABASE_HOST=db.xxxxxxxxxxxx.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your_supabase_password
DATABASE_SCHEMA=public
```

### สำหรับ Production Server
```env
DATABASE_HOST=your-server.com
DATABASE_PORT=5432
DATABASE_NAME=production_db
DATABASE_USER=db_user
DATABASE_PASSWORD=secure_password
DATABASE_SCHEMA=app_schema
```

## การตั้งค่าเพิ่มเติม

### SSL Connection
```env
DATABASE_SSL_MODE=require
DATABASE_SSL_CERT=path/to/cert.pem
```

### Multiple Schemas
```env
DATABASE_SCHEMA=schema1,schema2,schema3
```

## การ Restore

### จากไฟล์ backup
```bash
psql -h localhost -U username -d database_name -f backup_file.sql
```

### สำหรับ Supabase
```bash
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -f backup_file.sql
```

## ข้อกำหนด

- Python 3.7+
- PostgreSQL client tools (pg_dump)
- python-dotenv package

## การแก้ไขปัญหา

### 1. ไม่พบ pg_dump
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# ดาวน์โหลด PostgreSQL client จาก https://www.postgresql.org/download/windows/
```

### 2. ไม่พบไฟล์ .env
- ตรวจสอบว่าสร้างไฟล์ .env แล้ว
- ตรวจสอบตำแหน่งไฟล์ .env ว่าอยู่ในโฟลเดอร์เดียวกับสคริปต์

### 3. Connection Error
- ตรวจสอบการตั้งค่าในไฟล์ .env
- ตรวจสอบว่า PostgreSQL server กำลังทำงาน
- ตรวจสอบ firewall และ network settings

## การใช้งานแบบ Automation

### Cron Job (Linux/macOS)
```bash
# แก้ไข crontab
crontab -e

# เพิ่มบรรทัดนี้เพื่อ backup ทุกวันเวลา 2:00 AM
0 2 * * * cd /path/to/backup/script && python backup_postgres.py
```

### Windows Task Scheduler
1. เปิด Task Scheduler
2. สร้าง Basic Task
3. ตั้งเวลาและเลือกไฟล์ `backup_postgres.py`

## การบำรุงรักษา

### ลบไฟล์ backup เก่า
```bash
# ลบไฟล์ที่เก่ากว่า 30 วัน
find backups/ -name "*.sql" -mtime +30 -delete
```

### ตรวจสอบขนาดไฟล์
```bash
# ดูขนาดไฟล์ backup
du -sh backups/*.sql
``` 