import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Config_LocationsUserService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationsUserService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async getLocationByUserId(
    userId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getLocationByUserId',
        userId,
        version,
      },
      Config_LocationsUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  async managerLocationUser(
    userId: string,
    updateDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'managerLocationUser',
        userId,
        version,
      },
      Config_LocationsUserService.name,
    );
    throw new NotImplementedException('Not implemented');
  }
}
