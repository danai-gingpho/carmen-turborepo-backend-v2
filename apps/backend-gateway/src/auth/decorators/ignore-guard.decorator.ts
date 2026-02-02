import { SetMetadata, Type } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';

// A unique key to store the metadata
export const IGNORE_GUARDS_KEY = 'ignore_guards';

// Type for guard classes - using NestJS Type for better compatibility
type GuardClass = Type<CanActivate>;

// This decorator accepts a list of Guard classes (e.g., MyGuard)
export const IgnoreGuards = (...guards: GuardClass[]) => SetMetadata(IGNORE_GUARDS_KEY, guards)