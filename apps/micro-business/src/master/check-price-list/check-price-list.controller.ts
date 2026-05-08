import { Controller, HttpStatus } from '@nestjs/common';
import { CheckPriceListService } from './check-price-list.service';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class CheckPriceListController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    CheckPriceListController.name,
  );

  constructor(private readonly checkPriceListService: CheckPriceListService) {
    super();
  }

  /**
   * Check and validate a price list by URL token
   * ตรวจสอบและยืนยันรายการราคาตาม URL token
   * @param payload - Microservice payload containing URL token and decoded token / ข้อมูล payload ที่มี URL token และ token ที่ถอดรหัสแล้ว
   * @returns Price list validation result / ผลการตรวจสอบรายการราคา
   */
  @MessagePattern({ cmd: 'check-price-list.check', service: 'check-price-list' })
  async checkPriceList(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'checkPriceList', payload },
      CheckPriceListController.name,
    );
    const { url_token: urlToken, decodedToken } = payload;
    const result = await this.checkPriceListService.checkPriceList(urlToken, decodedToken);
    return this.handleResult(result);
  }
}
