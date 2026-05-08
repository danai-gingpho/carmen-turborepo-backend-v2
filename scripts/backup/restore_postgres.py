#!/usr/bin/env python3
"""
PostgreSQL Restore Script
ใช้ไฟล์ .env สำหรับการตั้งค่าการเชื่อมต่อ
"""

import os
import subprocess
import sys
from pathlib import Path
from dotenv import load_dotenv

def load_environment():
    """โหลดไฟล์ .env"""
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
        'host': os.getenv('RESTORE_DATABASE_HOST', ''),
        'port': os.getenv('RESTORE_DATABASE_PORT', ''),
        'database': os.getenv('RESTORE_DATABASE_NAME', ''),
        'username': os.getenv('RESTORE_DATABASE_USER', ''),
        'password': os.getenv('RESTORE_DATABASE_PASSWORD', ''),
        'schema': os.getenv('RESTORE_DATABASE_SCHEMA', 'public')
    }
    
    print(config)

    return config

def list_backup_files():
    """แสดงรายการไฟล์ backup ที่มีอยู่"""
    backup_dir = Path("backups")
    if not backup_dir.exists():
        print("❌ ไม่พบโฟลเดอร์ backups/")
        return []
    
    backup_files = list(backup_dir.glob("*.sql"))
    if not backup_files:
        print("❌ ไม่พบไฟล์ backup ในโฟลเดอร์ backups/")
        return []
    
    print("📁 ไฟล์ backup ที่มีอยู่:")
    for i, file in enumerate(backup_files, 1):
        size_mb = file.stat().st_size / 1024 / 1024
        print(f"  {i}. {file.name} ({size_mb:.2f} MB)")
    
    return backup_files

def select_backup_file(backup_files):
    """เลือกไฟล์ backup"""
    if not backup_files:
        return None
    
    try:
        choice = input(f"\nเลือกไฟล์ backup (1-{len(backup_files)}): ").strip()
        index = int(choice) - 1
        if 0 <= index < len(backup_files):
            return backup_files[index]
        else:
            print("❌ เลือกไฟล์ไม่ถูกต้อง")
            return None
    except (ValueError, KeyboardInterrupt):
        print("❌ ยกเลิกการทำงาน")
        return None

def confirm_restore(database_name):
    """ยืนยันการ restore"""
    print(f"\n⚠️  คำเตือน: การ restore จะเขียนทับข้อมูลในฐานข้อมูล '{database_name}'")
    print("   ข้อมูลเดิมจะหายไป!")
    
    try:
        confirm = input("ยืนยันการ restore? (yes/no): ").strip().lower()
        return confirm in ['yes', 'y', 'ใช่']
    except KeyboardInterrupt:
        return False

def run_restore(config, backup_file_path):
    """รัน restore command"""
    
    print(f"🔄 เริ่ม restore...")
    print(f"   Server: {config['host']}")
    print(f"   Database: {config['database']}")
    print(f"   File: {backup_file_path}")
    
    # สร้าง psql command
    cmd = [
        'psql',
        '--host=' + config['host'],
        '--port=' + config['port'],
        '--username=' + config['username'],
        '--dbname=' + config['database'],
        '--file=' + str(backup_file_path)
    ]
    
    try:
        # รัน command
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=dict(os.environ, PGPASSWORD=config['password']) if config['password'] else os.environ
        )
        
        if result.returncode == 0:
            print("✅ Restore สำเร็จ!")
            return True
        else:
            print("❌ Restore ล้มเหลว!")
            print(f"Error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ ไม่พบ psql command")
        print("กรุณาติดตั้ง PostgreSQL client tools")
        return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False

def create_database_if_not_exists(config):
    """สร้างฐานข้อมูลถ้ายังไม่มี"""
    print(f"🔍 ตรวจสอบฐานข้อมูล '{config['database']}'...")
    
    # สร้าง command สำหรับตรวจสอบฐานข้อมูล
    check_cmd = [
        'psql',
        '--host=' + config['host'],
        '--port=' + config['port'],
        '--username=' + config['username'],
        '--dbname=postgres',  # ใช้ postgres เป็น default
        '--command=SELECT 1 FROM pg_database WHERE datname=\'' + config['database'] + '\';'
    ]
    
    try:
        result = subprocess.run(
            check_cmd,
            capture_output=True,
            text=True,
            env=dict(os.environ, PGPASSWORD=config['password']) if config['password'] else os.environ
        )
        
        # ถ้าไม่พบฐานข้อมูล ให้สร้างใหม่
        if result.returncode != 0 or not result.stdout.strip():
            print(f"📝 สร้างฐานข้อมูล '{config['database']}'...")
            
            create_cmd = [
                'createdb',
                '--host=' + config['host'],
                '--port=' + config['port'],
                '--username=' + config['username'],
                config['database']
            ]
            
            create_result = subprocess.run(
                create_cmd,
                capture_output=True,
                text=True,
                env=dict(os.environ, PGPASSWORD=config['password']) if config['password'] else os.environ
            )
            
            if create_result.returncode == 0:
                print(f"✅ สร้างฐานข้อมูล '{config['database']}' สำเร็จ!")
                return True
            else:
                print(f"❌ ไม่สามารถสร้างฐานข้อมูลได้: {create_result.stderr}")
                return False
        else:
            print(f"✅ ฐานข้อมูล '{config['database']}' มีอยู่แล้ว")
            return True
            
    except FileNotFoundError:
        print("❌ ไม่พบ PostgreSQL client tools")
        return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False

def main():
    """ฟังก์ชันหลัก"""
    print("🐘 PostgreSQL Restore Tool")
    print("=" * 40)
    
    # โหลด environment
    if not load_environment():
        sys.exit(1)
    
    # ดึงการตั้งค่า
    config = get_database_config()
    if not config:
        sys.exit(1)
    
    # แสดงรายการไฟล์ backup
    backup_files = list_backup_files()
    if not backup_files:
        sys.exit(1)
    
    # เลือกไฟล์ backup
    backup_file = select_backup_file(backup_files)
    if not backup_file:
        sys.exit(1)
    
    # ยืนยันการ restore
    if not confirm_restore(config['database']):
        print("❌ ยกเลิกการ restore")
        sys.exit(1)
    
    # สร้างฐานข้อมูลถ้ายังไม่มี
    if not create_database_if_not_exists(config):
        sys.exit(1)
    
    # รัน restore
    success = run_restore(config, backup_file)
    
    if success:
        print(f"\n🎉 Restore เสร็จสิ้น!")
        print(f"📁 ไฟล์: {backup_file}")
    else:
        print("\n❌ Restore ล้มเหลว!")
        sys.exit(1)

if __name__ == "__main__":
    main() 