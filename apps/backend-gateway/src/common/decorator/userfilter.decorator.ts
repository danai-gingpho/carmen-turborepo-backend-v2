import { applyDecorators, Logger } from '@nestjs/common';
import { ApiHeader, ApiQuery } from '@nestjs/swagger';
import { nullable } from 'zod';
import { BackendLogger } from '../helpers/backend.logger';

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

export function ApiHeaderRequestTenantId() {
  const logger = new BackendLogger(ApiHeaderRequestTenantId.name);

  logger.debug(
    {
      function: 'ApiHeaderRequestTenantId',
    },
    'ApiHeaderRequestTenantId',
  );

  return applyDecorators(
    ApiHeader({
      name: 'x-tenant-id',
      description: 'Tenant ID',
      examples: {
        'Example for backend development': {
          value: 'b2ac1375-cd8b-4b39-91f2-7548c100534e',
          summary: 'Tenant ID for backend development',
        },
        'Example for frontend development': {
          value: 'ec7792a9-d88a-4454-ae05-6cea81cf89fd',
          summary: 'Tenant ID for frontend development',
        },
      },
      required: true,
    }),
  );
}

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
