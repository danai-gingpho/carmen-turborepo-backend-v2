import { Injectable } from '@nestjs/common';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Injectable()
export class AppService {
  private readonly logger: BackendLogger = new BackendLogger(AppService.name);
  /**
   * Get hello message
   * ดึงข้อความต้อนรับ
   * @returns Hello world message / ข้อความต้อนรับ
   */
  getHello(): string {
    this.logger.debug({ function: 'getHello' }, AppService.name);
    return 'Hello World!';
  }
}
