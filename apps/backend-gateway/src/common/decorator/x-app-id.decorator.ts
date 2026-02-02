import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { BackendLogger } from '../helpers/backend.logger';

export function ApiHeaderRequiredXAppId() {
  const logger = new BackendLogger(ApiHeaderRequiredXAppId.name);

  logger.debug(
    {
      function: 'ApiHeaderRequiredXAppId',
    },
    'ApiHeaderRequiredXAppId',
  );

  return applyDecorators(
    ApiHeader({
      name: 'x-app-id',
      description: 'Application ID',
      required: false,
      examples: {
        'Example for mobile app': {
          value: '00000000-0000-0000-0000-000000000000',
          summary: 'Application ID for mobile app',
        },
        'Example for frontend website': {
          value: '9c83fd4b-ce3f-4de2-a522-349ad1280b10',
          summary: 'Application ID for frontend website',
        },
      },

    }),
  );
}
