import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { nullable } from 'zod';
import { BackendLogger } from '../helpers/backend.logger';

/**
 * Swagger decorator to add version query parameter
 * เดคอเรเตอร์ Swagger สำหรับเพิ่มพารามิเตอร์ query เวอร์ชัน
 */
export function ApiVersionMinRequest(version: string = 'latest') {
  const logger = new BackendLogger(ApiVersionMinRequest.name);

  logger.debug(
    {
      function: 'ApiVersionMinRequest',
      version,
    },
    'ApiVersionMinRequest',
  );

  return applyDecorators(
    ApiQuery({
      name: 'version',
      description: 'Version',
      type: String,
      required: false,
      default: version,
    }),
  );
}

/**
 * Swagger decorator to add pagination and filter query parameters
 * เดคอเรเตอร์ Swagger สำหรับเพิ่มพารามิเตอร์ query การแบ่งหน้าและตัวกรอง
 */
export function ApiUserFilterQueries() {
  const logger = new BackendLogger(ApiUserFilterQueries.name);

  logger.debug(
    {
      function: 'ApiUserFilterQueries',
    },
    'ApiUserFilterQueries',
  );

  return applyDecorators(
    ApiQuery({
      name: 'page',
      description: 'Page',
      required: false,
      default: 1,
      type: Number || nullable,
    }),
    ApiQuery({
      name: 'perpage',
      description: 'Perpage',
      required: false,
      default: 10,
      type: Number || nullable,
    }),
    ApiQuery({
      name: 'search',
      description: 'Search',
      required: false,
      default: '',
      type: String || nullable,
    }),
    ApiQuery({
      name: 'filter',
      description: 'Filter',
      required: false,
      default: [],
      type: 'Record<string, string>',
    }),
    ApiQuery({
      name: 'searchfields',
      description: 'searchfields',
      required: false,
      default: [],
      type: [String],
    }),
    ApiQuery({
      name: 'sort',
      description: 'sort',
      required: false,
      default: [],
      type: [String],
    }),
  );
}
