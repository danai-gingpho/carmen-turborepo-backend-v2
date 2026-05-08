# Backup & Restore Operations

## Overview

ชุดเครื่องมือสำหรับ backup และ restore ฐานข้อมูล PostgreSQL โดยใช้ไฟล์ .env

### โครงสร้างไฟล์

```
scripts/backup/
├── backup_postgres.py          # สคริปต์ backup หลัก
├── restore_postgres.py         # สคริปต์ restore
├── cleanup_backups.py          # สคริปต์ลบไฟล์เก่า
├── auto_backup.sh             # สคริปต์ backup แบบ automation
├── setup.sh                   # สคริปต์ติดตั้ง
├── setup_cron.sh              # สคริปต์ตั้งค่า cron job
├── requirements.txt            # Python dependencies
├── env.example                # ตัวอย่างไฟล์ .env
└── .gitignore                 # Git ignore rules
```

### การติดตั้ง

#### ติดตั้งแบบอัตโนมัติ
```bash
cd scripts/backup
chmod +x setup.sh
./setup.sh
```

#### ติดตั้งแบบ manual
```bash
# ติดตั้ง dependencies
pip3 install -r requirements.txt

# สร้างไฟล์ .env
cp env.example .env

# แก้ไขไฟล์ .env
nano .env

# สร้างโฟลเดอร์ backups
mkdir -p backups
```

### การตั้งค่า

#### ไฟล์ .env
```env
# PostgreSQL Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
DATABASE_SCHEMA=your_schema_name

# Backup Configuration (optional)
BACKUP_TYPE=full              # full, schema_only, data_only
BACKUP_MAX_DAYS=30           # อายุสูงสุดของไฟล์ backup
BACKUP_MAX_SIZE_MB=1000      # ขนาดสูงสุดของไฟล์ backup
BACKUP_KEEP_MINIMUM=5        # จำนวนไฟล์ขั้นต่ำที่เก็บไว้
```

### การใช้งาน

#### 1. Backup แบบ Interactive
```bash
python3 backup_postgres.py
```

#### 2. Restore แบบ Interactive
```bash
python3 restore_postgres.py
```

#### 3. ลบไฟล์ backup เก่า
```bash
python3 cleanup_backups.py
```

#### 4. Backup แบบ Automation
```bash
# รันครั้งเดียว
./auto_backup.sh

# ตั้งค่า cron job
./setup_cron.sh [frequency] [time]
# ตัวอย่าง: ./setup_cron.sh daily 02:00
```

### การตั้งค่า Cron Job

#### ตั้งค่าแบบอัตโนมัติ
```bash
# Backup ทุกวันเวลา 2:00 AM
./setup_cron.sh daily

# Backup ทุกสัปดาห์
./setup_cron.sh weekly

# Backup ทุกเดือน
./setup_cron.sh monthly
```

#### ตั้งค่าแบบ manual
```bash
# แก้ไข crontab
crontab -e

# เพิ่มบรรทัดนี้
0 2 * * * cd /path/to/scripts/backup && ./auto_backup.sh >> backup.log 2>&1
```

### การตรวจสอบ

```bash
# ดู cron jobs
crontab -l

# ดู log
tail -f backup.log

# ดูไฟล์ backup
ls -la backups/
du -sh backups/
```

### การแก้ไขปัญหา

#### 1. ไม่พบ pg_dump
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# ดาวน์โหลดจาก https://www.postgresql.org/download/windows/
```

#### 2. ไม่พบ Python dependencies
```bash
pip3 install -r requirements.txt
```

#### 3. ไม่สามารถเชื่อมต่อฐานข้อมูล
- ตรวจสอบการตั้งค่าในไฟล์ .env
- ตรวจสอบว่า PostgreSQL server กำลังทำงาน
- ตรวจสอบ firewall และ network settings

#### 4. Cron job ไม่ทำงาน
```bash
# ตรวจสอบ cron service
sudo systemctl status cron

# ตรวจสอบ log
tail -f /var/log/cron

# ทดสอบรันสคริปต์
./auto_backup.sh
```

### ตัวอย่างการตั้งค่า

#### สำหรับ Local Development
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=mypassword
DATABASE_SCHEMA=public
```

#### สำหรับ Supabase
```env
DATABASE_HOST=db.xxxxxxxxxxxx.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your_supabase_password
DATABASE_SCHEMA=public
```

#### สำหรับ Production
```env
DATABASE_HOST=your-server.com
DATABASE_PORT=5432
DATABASE_NAME=production_db
DATABASE_USER=db_user
DATABASE_PASSWORD=secure_password
DATABASE_SCHEMA=app_schema
```

### ความปลอดภัย

#### 1. ไฟล์ .env
- อย่า commit ไฟล์ .env เข้า Git
- ใช้ .env.example เป็นเทมเพลต
- ตั้งค่า password ที่แข็งแกร่ง

#### 2. ไฟล์ backup
- เก็บไฟล์ backup ในที่ปลอดภัย
- เข้ารหัสไฟล์ backup ถ้าจำเป็น
- ลบไฟล์เก่าอย่างสม่ำเสมอ

#### 3. การเข้าถึง
- จำกัดการเข้าถึงโฟลเดอร์ backups/
- ใช้ user ที่มีสิทธิ์จำกัดสำหรับ backup
- ตรวจสอบ log อย่างสม่ำเสมอ

### เอกสารอ้างอิง

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Cron Documentation](https://man7.org/linux/man-pages/man5/crontab.5.html)

### การสนับสนุน

หากพบปัญหาในการใช้งาน:

1. ตรวจสอบ log files
2. ตรวจสอบการตั้งค่าในไฟล์ .env
3. ทดสอบการเชื่อมต่อฐานข้อมูล
4. ตรวจสอบสิทธิ์การเข้าถึงไฟล์และโฟลเดอร์

## Backup guide

Commands for backing up a PostgreSQL database (for dev.blueledgers.com).

### Data-only dump

```batch
pg_dump --verbose --host=dev.blueledgers.com --port=6432 --username=developer --dbname=postgres --data-only > blueledgers.backup.sql
```

### Convert COPY statements to INSERT statements

```batch
/usr/local/bin/python3 scripts/backup/convert-copy-to-insert.py
```
