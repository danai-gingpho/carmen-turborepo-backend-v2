import { Response } from 'express';
import { Result } from '../result/result';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { StdResponse } from '../std-response/std-response';

export abstract class BaseHttpController {
  /**
   * Send a standardized HTTP response from a Result object or plain data
   * ส่ง HTTP response มาตรฐานจาก Result object หรือข้อมูลทั่วไป
   * @param response - Express response object / อ็อบเจกต์ response ของ Express
   * @param result - Result object or plain response data / Result object หรือข้อมูล response ทั่วไป
   * @param customStatus - Optional custom HTTP status code / รหัสสถานะ HTTP ที่กำหนดเอง (ถ้ามี)
   */
  protected respond(
    response: Response,
    result: Result<unknown> | unknown,
    customStatus?: HttpStatus,
  ) {
    // Check if result is a Result object (has isOk method)
    if (result && typeof (result as Record<string, unknown>).isOk === 'function') {
      const stdResponse = StdResponse.fromResult<unknown, unknown>(result as Result<unknown, unknown>);
      const status = customStatus ?? stdResponse.status;
      response.status(status).send(stdResponse);
    } else {
      // Handle plain response objects (legacy ResponseLib format)
      const plainResult = result as Record<string, unknown> | null | undefined;
      const status = customStatus ?? (plainResult?.status as number) ?? HttpStatus.OK;
      response.status(status).send(result);
    }
  }
}
