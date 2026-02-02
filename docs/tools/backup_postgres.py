#!/usr/bin/env python3
"""
PostgreSQL Backup Script
ใช้ไฟล์ .env สำหรับการตั้งค่าการเชื่อมต่อ
"""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

def load_environment():
    """โหลดไฟล์ .env"""
    # ลองหาไฟล์ .env ในหลายตำแหน่ง
    env_paths = [
        '.env',
        '../.env',
        '../../.env',
        '.env.local',
        '.env.production',
        '.env.development'
    ]
    
    for env_path in env_paths:
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"✅ โหลดไฟล์ .env จาก: {env_path}")
            return True
    
    print("❌ ไม่พบไฟล์ .env")
    return False

def get_database_config():
    """ดึงการตั้งค่าฐานข้อมูลจาก environment variables"""
    config = {
        'host': os.getenv('BACKUP_DATABASE_HOST', ''),
        'port': os.getenv('BACKUP_DATABASE_PORT', ''),
        'database': os.getenv('BACKUP_DATABASE_NAME', ''),
        'username': os.getenv('BACKUP_DATABASE_USER', ''),
        'password': os.getenv('BACKUP_DATABASE_PASSWORD', ''),
        'schema': os.getenv('BACKUP_DATABASE_SCHEMA', 'public')
    }

    print(config)
    
    # ตรวจสอบว่ามีข้อมูลครบหรือไม่
    missing_vars = []
    for key, value in config.items():
        if not value and key != 'password':  # password อาจเป็นค่าว่างได้
            missing_vars.append(key)
    
    if missing_vars:
        print(f"❌ ขาด environment variables: {', '.join(missing_vars)}")
        print("กรุณาตั้งค่าในไฟล์ .env:")
        for var in missing_vars:
            print(f"  {var.upper()}=your_value")
        return None
    
    return config

def create_backup_directory():
    """สร้างโฟลเดอร์สำหรับเก็บ backup"""
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    return backup_dir

def generate_backup_filename(server_name, database_name, schema_name):
    """สร้างชื่อไฟล์ backup"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{server_name}_{database_name}_{schema_name}_{timestamp}.sql"

def run_backup(config, backup_file_path, backup_type="full"):
    """รัน backup command"""
    
    # สร้าง connection string
    if config['password']:
        connection_string = f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
    else:
        connection_string = f"postgresql://{config['username']}@{config['host']}:{config['port']}/{config['database']}"
    
    # สร้าง pg_dump command
    cmd = [
        'pg_dump',
        '--verbose',
        '--host=' + config['host'],
        '--port=' + config['port'],
        '--username=' + config['username'],
        '--dbname=' + config['database'],
        '--file=' + str(backup_file_path),
        '--format=plain',
        '--encoding=UTF8'
    ]
    
    # เพิ่ม options ตาม backup type
    if backup_type == "schema_only":
        cmd.append('--schema-only')
    elif backup_type == "data_only":
        cmd.append('--data-only')
    elif backup_type == "full":
        pass  # default คือ full backup
    
    # เพิ่ม schema ถ้ามี
    if config['schema'] and config['schema'] != 'public':
        cmd.extend(['--schema=' + config['schema']])
    
    print(f"🔄 เริ่ม backup...")
    print(f"   Server: {config['host']}")
    print(f"   Database: {config['database']}")
    print(f"   Schema: {config['schema']}")
    print(f"   Type: {backup_type}")
    print(f"   Output: {backup_file_path}")
    
    try:
        # รัน command
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=dict(os.environ, PGPASSWORD=config['password']) if config['password'] else os.environ
        )
        
        if result.returncode == 0:
            print("✅ Backup สำเร็จ!")
            print(f"📁 ไฟล์: {backup_file_path}")
            return True
        else:
            print("❌ Backup ล้มเหลว!")
            print(f"Error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ ไม่พบ pg_dump command")
        print("กรุณาติดตั้ง PostgreSQL client tools")
        return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False

def main():
    """ฟังก์ชันหลัก"""
    print("🐘 PostgreSQL Backup Tool")
    print("=" * 40)
    
    # โหลด environment
    if not load_environment():
        sys.exit(1)
    
    # ดึงการตั้งค่า
    config = get_database_config()
    if not config:
        sys.exit(1)
    
    # สร้างโฟลเดอร์ backup
    backup_dir = create_backup_directory()
    
    # สร้างชื่อไฟล์
    backup_filename = generate_backup_filename(
        config['host'],
        config['database'], 
        config['schema']
    )
    backup_file_path = backup_dir / backup_filename
    
    # ถามประเภท backup
    print("\nเลือกประเภท backup:")
    print("1. Full backup (schema + data)")
    print("2. Schema only")
    print("3. Data only")
    
    try:
        choice = input("เลือก (1-3): ").strip()
        backup_types = {
            '1': 'full',
            '2': 'schema_only', 
            '3': 'data_only'
        }
        backup_type = backup_types.get(choice, 'full')
    except KeyboardInterrupt:
        print("\n❌ ยกเลิกการทำงาน")
        sys.exit(1)
    
    # รัน backup
    success = run_backup(config, backup_file_path, backup_type)
    
    if success:
        print(f"\n🎉 Backup เสร็จสิ้น!")
        print(f"📁 ไฟล์: {backup_file_path}")
        print(f"📏 ขนาด: {backup_file_path.stat().st_size / 1024 / 1024:.2f} MB")
    else:
        print("\n❌ Backup ล้มเหลว!")
        sys.exit(1)

if __name__ == "__main__":
    main() 