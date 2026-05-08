import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  private readonly logger: BackendLogger = new BackendLogger(
    AppController.name,
  );
  constructor(private readonly appService: AppService) {}

  /**
   * Get hello message from the file service
   * ดึงข้อความต้อนรับจากบริการไฟล์
   * @returns Hello message / ข้อความต้อนรับ
   */
  @Get()
  @ApiExcludeEndpoint(true)
  getHello(): string {
    this.logger.debug({ function: 'getHello' }, AppController.name);
    return this.appService.getHello();
  }

  /**
   * Check health status of the file service
   * ตรวจสอบสถานะการทำงานของบริการไฟล์
   * @returns Health status string / สถานะการทำงาน
   */
  @Get('health')
  @ApiExcludeEndpoint(true)
  getHealth(): string {
    this.logger.debug({ function: 'getHealth' }, AppController.name);
    return 'OK';
  }
}
