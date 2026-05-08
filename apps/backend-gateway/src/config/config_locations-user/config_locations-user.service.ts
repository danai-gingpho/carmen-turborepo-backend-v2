import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_LocationsUserService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationsUserService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async getLocationByUserId(
    userId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getLocationByUserId', userId, version },
      Config_LocationsUserService.name,
    );

    const response = await firstValueFrom(
      this.masterService.send(
      { cmd: 'locations.getLocationsByUserId', service: 'locations' },
      { target_user_id: userId, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async managerLocationUser(
    userId: string,
    updateDto: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'managerLocationUser', userId, version },
      Config_LocationsUserService.name,
    );

    const locationIds = (updateDto.location_ids || []) as string[];

    const response = await firstValueFrom(
      this.masterService.send(
      { cmd: 'locations.updateUserLocations', service: 'locations' },
      { target_user_id: userId, location_ids: locationIds, user_id, bu_code, version, ...getGatewayRequestContext() },
    ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
