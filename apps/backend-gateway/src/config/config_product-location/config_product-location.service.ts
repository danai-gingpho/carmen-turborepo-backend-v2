import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Config_ProductLocationService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductLocationService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async getLocationsByProductId(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getLocationsByProductId',
        productId,
        user_id,
        bu_code,
        version,
      },
      Config_ProductLocationService.name,
    );

    throw new NotImplementedException('Not implemented');
  }
}
