import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Config_LocationProductService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationProductService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async getProductByLocationId(
    locationId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getProductByLocationId',
        locationId,
        version,
      },
      Config_LocationProductService.name,
    );
    throw new NotImplementedException('Not implemented');
  }
}
