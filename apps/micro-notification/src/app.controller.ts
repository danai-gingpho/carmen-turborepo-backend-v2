import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Get hello message from the notification service
   * ดึงข้อความต้อนรับจากบริการแจ้งเตือน
   * @returns Hello message / ข้อความต้อนรับ
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Check health status of the notification service
   * ตรวจสอบสถานะการทำงานของบริการแจ้งเตือน
   * @returns Health status string / สถานะการทำงาน
   */
  @Get('health')
  getHealth(): string {
    return 'OK';
  }
}
