import { SetMetadata, Type } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';

// A unique key to store the metadata
export const IGNORE_GUARDS_KEY = 'ignore_guards';

// Type for guard classes - using NestJS Type for better compatibility
type GuardClass = Type<CanActivate>;

/**
 * Decorator to bypass specific guards on a route or controller
 * เดคอเรเตอร์สำหรับข้ามการตรวจสอบ guard ที่ระบุบนเส้นทางหรือคอนโทรลเลอร์
 * @param guards - Guard classes to skip (e.g., KeycloakGuard) / คลาส guard ที่ต้องการข้าม (เช่น KeycloakGuard)
 * @returns Route metadata decorator / เดคอเรเตอร์ metadata ของเส้นทาง
 */
export const IgnoreGuards = (...guards: GuardClass[]) => SetMetadata(IGNORE_GUARDS_KEY, guards)