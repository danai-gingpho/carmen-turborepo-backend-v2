import {
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { Result } from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class VendorProductService {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorProductService.name,
  );

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  async findAll(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  async create(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  async update(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }
}
