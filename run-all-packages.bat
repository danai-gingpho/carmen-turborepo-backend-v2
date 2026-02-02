@echo off
REM Carmen Turborepo Backend - Run All Packages Script (Windows)
REM สคริปต์สำหรับรันทุก package ใน apps/ directory ใน terminal แยกกัน

echo 🚀 Carmen Turborepo Backend - Run All Packages Script
echo ================================================

REM ตรวจสอบว่าอยู่ใน root directory หรือไม่
if not exist "package.json" (
    echo [ERROR] กรุณารันสคริปต์นี้จาก root directory ของโปรเจค
    pause
    exit /b 1
)

if not exist "turbo.json" (
    echo [ERROR] กรุณารันสคริปต์นี้จาก root directory ของโปรเจค
    pause
    exit /b 1
)

REM รายการ microservices ที่จะรัน
set MICROSERVICES=micro-authen micro-cluster micro-file micro-license micro-notification micro-reports micro-tenant-inventory micro-tenant-master micro-tenant-procurement micro-tenant-recipe backend-gateway

echo [INFO] กำลังเปิด terminal สำหรับแต่ละ package...
echo.

REM รันแต่ละ microservice ใน terminal แยกกัน
for %%s in (%MICROSERVICES%) do (
    if exist "apps\%%s\package.json" (
        echo [INFO] เปิด terminal สำหรับ %%s...
        start "%%s - Carmen Backend" cmd /k "cd /d %CD%\apps\%%s && echo [INFO] กำลังรัน %%s... && echo [INFO] Directory: %CD%\apps\%%s && echo [INFO] รันคำสั่ง: bun run dev && echo. && bun run dev"
        timeout /t 2 /nobreak >nul
    ) else (
        echo [WARNING] ไม่พบ package.json ใน %%s ข้ามไป
    )
)

echo.
echo [SUCCESS] 🎉 เปิด terminal สำหรับทุก package แล้ว!
echo.
echo [INFO] สรุป:
echo   - Microservices: ✅
echo   - Backend Gateway: ✅
echo.
echo [INFO] แต่ละ terminal จะรันคำสั่ง 'bun run dev' โดยอัตโนมัติ
echo [INFO] ปิด terminal เพื่อหยุดการทำงานของ service นั้น
echo.
pause
