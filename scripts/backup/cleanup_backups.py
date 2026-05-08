#!/usr/bin/env python3
"""
PostgreSQL Backup Cleanup Script
ลบไฟล์ backup เก่าตามเงื่อนไขที่กำหนด
"""

import os
import sys
from datetime import datetime, timedelta
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
            return True
    
    return False

def get_cleanup_config():
    """ดึงการตั้งค่าการ cleanup จาก environment variables"""
    config = {
        'max_days': int(os.getenv('BACKUP_MAX_DAYS', '30')),
        'max_size_mb': int(os.getenv('BACKUP_MAX_SIZE_MB', '1000')),
        'keep_minimum': int(os.getenv('BACKUP_KEEP_MINIMUM', '5'))
    }
    
    return config

def list_backup_files():
    """แสดงรายการไฟล์ backup ที่มีอยู่"""
    backup_dir = Path("backups")
    if not backup_dir.exists():
        print("❌ ไม่พบโฟลเดอร์ backups/")
        return []
    
    backup_files = list(backup_dir.glob("*.sql"))
    backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    
    return backup_files

def calculate_file_age(file_path):
    """คำนวณอายุไฟล์เป็นวัน"""
    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
    age = datetime.now() - mtime
    return age.days

def calculate_total_size(files):
    """คำนวณขนาดรวมของไฟล์"""
    total_size = sum(file.stat().st_size for file in files)
    return total_size / 1024 / 1024  # แปลงเป็น MB

def cleanup_old_files(backup_files, max_days, keep_minimum):
    """ลบไฟล์เก่าตามอายุ"""
    if len(backup_files) <= keep_minimum:
        print(f"📊 มีไฟล์ backup {len(backup_files)} ไฟล์ (น้อยกว่าขั้นต่ำ {keep_minimum} ไฟล์)")
        return []
    
    files_to_delete = []
    files_to_keep = backup_files[:keep_minimum]  # เก็บไฟล์ใหม่ล่าสุด
    
    for file in backup_files[keep_minimum:]:
        age = calculate_file_age(file)
        if age > max_days:
            files_to_delete.append(file)
    
    return files_to_delete

def cleanup_by_size(backup_files, max_size_mb, keep_minimum):
    """ลบไฟล์ตามขนาด"""
    if len(backup_files) <= keep_minimum:
        return []
    
    total_size = calculate_total_size(backup_files)
    if total_size <= max_size_mb:
        print(f"📊 ขนาดรวม: {total_size:.2f} MB (น้อยกว่าขีดจำกัด {max_size_mb} MB)")
        return []
    
    files_to_delete = []
    files_to_keep = backup_files[:keep_minimum]
    
    # ลบไฟล์เก่าจนกว่าขนาดจะอยู่ในขีดจำกัด
    remaining_files = backup_files[keep_minimum:]
    current_size = calculate_total_size(files_to_keep)
    
    for file in remaining_files:
        file_size_mb = file.stat().st_size / 1024 / 1024
        if current_size + file_size_mb > max_size_mb:
            files_to_delete.append(file)
        else:
            current_size += file_size_mb
    
    return files_to_delete

def delete_files(files_to_delete):
    """ลบไฟล์ที่เลือก"""
    if not files_to_delete:
        print("✅ ไม่มีไฟล์ที่ต้องลบ")
        return True
    
    print(f"🗑️  จะลบไฟล์ {len(files_to_delete)} ไฟล์:")
    total_size = 0
    
    for file in files_to_delete:
        size_mb = file.stat().st_size / 1024 / 1024
        age = calculate_file_age(file)
        total_size += size_mb
        print(f"   - {file.name} ({size_mb:.2f} MB, {age} วัน)")
    
    print(f"📏 ขนาดรวมที่จะลบ: {total_size:.2f} MB")
    
    try:
        confirm = input("\nยืนยันการลบไฟล์? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y', 'ใช่']:
            print("❌ ยกเลิกการลบไฟล์")
            return False
        
        deleted_count = 0
        for file in files_to_delete:
            try:
                file.unlink()
                deleted_count += 1
                print(f"✅ ลบไฟล์: {file.name}")
            except Exception as e:
                print(f"❌ ไม่สามารถลบไฟล์ {file.name}: {e}")
        
        print(f"🎉 ลบไฟล์สำเร็จ {deleted_count}/{len(files_to_delete)} ไฟล์")
        return True
        
    except KeyboardInterrupt:
        print("\n❌ ยกเลิกการลบไฟล์")
        return False

def show_statistics(backup_files):
    """แสดงสถิติไฟล์ backup"""
    if not backup_files:
        print("📊 ไม่มีไฟล์ backup")
        return
    
    total_size = calculate_total_size(backup_files)
    oldest_file = min(backup_files, key=lambda x: x.stat().st_mtime)
    newest_file = max(backup_files, key=lambda x: x.stat().st_mtime)
    
    oldest_age = calculate_file_age(oldest_file)
    newest_age = calculate_file_age(newest_file)
    
    print("📊 สถิติไฟล์ backup:")
    print(f"   จำนวนไฟล์: {len(backup_files)}")
    print(f"   ขนาดรวม: {total_size:.2f} MB")
    print(f"   ไฟล์เก่าสุด: {oldest_file.name} ({oldest_age} วัน)")
    print(f"   ไฟล์ใหม่สุด: {newest_file.name} ({newest_age} วัน)")

def main():
    """ฟังก์ชันหลัก"""
    print("🧹 PostgreSQL Backup Cleanup Tool")
    print("=" * 40)
    
    # โหลด environment (ถ้ามี)
    load_environment()
    
    # ดึงการตั้งค่า
    config = get_cleanup_config()
    
    print(f"⚙️  การตั้งค่า:")
    print(f"   เก็บไฟล์ขั้นต่ำ: {config['keep_minimum']} ไฟล์")
    print(f"   อายุสูงสุด: {config['max_days']} วัน")
    print(f"   ขนาดสูงสุด: {config['max_size_mb']} MB")
    
    # แสดงรายการไฟล์ backup
    backup_files = list_backup_files()
    if not backup_files:
        print("❌ ไม่มีไฟล์ backup")
        sys.exit(1)
    
    # แสดงสถิติ
    show_statistics(backup_files)
    
    # เลือกประเภทการ cleanup
    print("\nเลือกประเภทการ cleanup:")
    print("1. ลบตามอายุ (เก่ากว่า {} วัน)".format(config['max_days']))
    print("2. ลบตามขนาด (เกิน {} MB)".format(config['max_size_mb']))
    print("3. ลบทั้งอายุและขนาด")
    
    try:
        choice = input("เลือก (1-3): ").strip()
        
        files_to_delete = []
        
        if choice == '1':
            files_to_delete = cleanup_old_files(backup_files, config['max_days'], config['keep_minimum'])
        elif choice == '2':
            files_to_delete = cleanup_by_size(backup_files, config['max_size_mb'], config['keep_minimum'])
        elif choice == '3':
            files_by_age = cleanup_old_files(backup_files, config['max_days'], config['keep_minimum'])
            files_by_size = cleanup_by_size(backup_files, config['max_size_mb'], config['keep_minimum'])
            files_to_delete = list(set(files_by_age + files_by_size))
        else:
            print("❌ เลือกไม่ถูกต้อง")
            sys.exit(1)
        
        # ลบไฟล์
        delete_files(files_to_delete)
        
    except KeyboardInterrupt:
        print("\n❌ ยกเลิกการทำงาน")
        sys.exit(1)

if __name__ == "__main__":
    main() 