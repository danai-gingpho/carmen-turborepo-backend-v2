import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Controller()
export class AppController {
  private readonly logger: BackendLogger = new BackendLogger(
    AppController.name,
  );
  constructor(private readonly appService: AppService) {}

  /**
   * Get hello message from the Keycloak API service
   * ดึงข้อความต้อนรับจากบริการ Keycloak API
   * @returns Hello message / ข้อความต้อนรับ
   */
  @Get()
  getHello(): string {
    this.logger.debug({ function: 'getHello' }, AppController.name);
    return this.appService.getHello();
  }

  /**
   * Check health status of the Keycloak API service
   * ตรวจสอบสถานะการทำงานของบริการ Keycloak API
   * @returns Health status string / สถานะการทำงาน
   */
  @Get('health')
  getHealth(): string {
    this.logger.debug({ function: 'getHealth' }, AppController.name);
    return 'OK';
  }
}
