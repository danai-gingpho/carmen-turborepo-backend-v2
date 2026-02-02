import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Config_UserLocationService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UserLocationService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async getUsersByLocationId(
    locationId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getUsersByLocationId',
        locationId,
        version,
      },
      Config_UserLocationService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  async managerUserLocation(
    locationId: string,
    updateDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'managerUserLocation',
        locationId,
        updateDto,
        version,
      },
      Config_UserLocationService.name,
    );
    throw new NotImplementedException('Not implemented');
  }
}
