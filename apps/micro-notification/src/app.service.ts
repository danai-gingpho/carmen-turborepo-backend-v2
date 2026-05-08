import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Get hello message
   * ดึงข้อความต้อนรับ
   * @returns Service status message / ข้อความสถานะบริการ
   */
  getHello(): string {
    return 'Notification Service is running!';
  }
}
