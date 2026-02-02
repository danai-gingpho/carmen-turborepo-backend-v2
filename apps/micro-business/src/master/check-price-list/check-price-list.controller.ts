import { Controller, HttpStatus } from '@nestjs/common';
import { CheckPriceListService } from './check-price-list.service';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class CheckPriceListController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CheckPriceListController.name,
  );

  constructor(private readonly checkPriceListService: CheckPriceListService) {
    super();
  }

  @MessagePattern({ cmd: 'check-price-list.check', service: 'check-price-list' })
  async checkPriceList(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'checkPriceList', payload },
      CheckPriceListController.name,
    );
    const { url_token: urlToken, decodedToken } = payload;
    const result = await this.checkPriceListService.checkPriceList(urlToken, decodedToken);
    return this.handleResult(result);
  }
}
