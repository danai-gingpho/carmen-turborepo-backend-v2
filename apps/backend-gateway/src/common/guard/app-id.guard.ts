import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { validate as uuidValidate } from 'uuid';
import { BackendLogger } from '../helpers/backend.logger';
import * as fs from 'fs';
import * as path from 'path';

interface AllowedApp {
  id: string;
  name: string;
  allow: string | string[];
}

const getAllowedApps = (): AllowedApp[] => {
  const logger = new BackendLogger('getAllowedApps');
  try {
    const configPath = path.resolve(__dirname, '../../../x-app-id.json');
    const data = fs.readFileSync(configPath, 'utf-8');

    const result =  JSON.parse(data) as AllowedApp[];

    logger.debug( {getAllowedApps : result} );

    return result;

  } catch (error) {
    logger.error({ error }, 'Failed to read x-app-id.json');
    return [];
  }
};

const CheckIsNotEmpty = (appId: string): boolean => {
  return appId && appId.trim() !== '';
};

const CheckAppIdIsUUID = (appId: string): boolean => {
  return uuidValidate(appId);
};

const CheckAppIdIsExistsAndAllow = (
  appId: string,
  api_name: string,
): boolean => {
  const logger = new BackendLogger(CheckAppIdIsExistsAndAllow.name);

  const allowedApps = getAllowedApps();

  logger.debug(allowedApps);

  const app = allowedApps.find((app) => app.id === appId);

  if (!app) {
    logger.debug(
      {
        function: 'CheckAppIdIsExistsAndAllow',
        appId,
        api_name,
        result: 'App not found',
      },
      'CheckAppIdIsExistsAndAllow',
    );
    return false;
  }

  // Check if app has wildcard access
  if (app.allow === '*') {
    logger.debug(
      {
        function: 'CheckAppIdIsExistsAndAllow',
        appId,
        api_name,
        appName: app.name,
        result: 'Allowed (wildcard)',
      },
      'CheckAppIdIsExistsAndAllow',
    );
    return true;
  }

  // Check if api_name is in the allow list
  const isAllowed = Array.isArray(app.allow) && app.allow.includes(api_name);

  logger.debug(
    {
      function: 'CheckAppIdIsExistsAndAllow',
      appId,
      api_name,
      appName: app.name,
      allowList: app.allow,
      isAllowed,
    },
    'CheckAppIdIsExistsAndAllow',
  );

  return isAllowed;
};

@Injectable()
export class AppIdGuard implements CanActivate {
  private api_name: string;

  constructor(api_name: string = '') {
    this.api_name = api_name;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const appId = request.headers['x-app-id'];

    const logger = new BackendLogger(AppIdGuard.name);

    logger.debug(
      {
        function: 'AppIdGuard',
        appId,
      },
      'AppIdGuard',
    );

    if (!CheckIsNotEmpty(appId)) {
      logger.error(
        {
          function: 'AppIdGuard',
          appId,
          error: 'x-app-id header is required',
        },
        'AppIdGuard',
      );

      throw new BadRequestException('x-app-id header is required');
    }

    if (!CheckAppIdIsUUID(appId)) {
      logger.error(
        {
          function: 'AppIdGuard',
          appId,
          error: 'x-app-id header is not a valid UUID [' + appId + ']',
        },
        'AppIdGuard',
      );

      throw new BadRequestException(
        'x-app-id header is not a valid UUID [' + appId + ']',
      );
    }

    if (!CheckAppIdIsExistsAndAllow(appId, this.api_name)) {
      logger.error(
        {
          function: 'AppIdGuard',
          appId,
          api_name: this.api_name,
          error: 'This application id (x-app-id) is not found or not allowed to access this api',
        },
        'AppIdGuard',
      );

      throw new UnauthorizedException('This application id (x-app-id) is not found or not allowed to access this api');
    }

    return true;
  }
}
