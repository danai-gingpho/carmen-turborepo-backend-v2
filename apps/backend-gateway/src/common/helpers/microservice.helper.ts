import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable, timeout, catchError, throwError } from 'rxjs';
import { BackendLogger } from './backend.logger';
import { getGatewayRequestContext } from '../context/gateway-request-context';

const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds

const logger = new BackendLogger('MicroserviceHelper');

/**
 * Send a message to a microservice with timeout and error handling
 * ส่งข้อความไปยังไมโครเซอร์วิสพร้อมการจัดการ timeout และข้อผิดพลาด
 * On timeout, attempts to reconnect and retry once before failing.
 * เมื่อ timeout จะพยายามเชื่อมต่อใหม่และลองอีกครั้งก่อนที่จะล้มเหลว
 * @param client - Microservice client proxy / พร็อกซีไคลเอนต์ไมโครเซอร์วิส
 * @param pattern - Message pattern / รูปแบบข้อความ
 * @param data - Payload data / ข้อมูลที่ส่งไป
 * @param timeoutMs - Timeout in milliseconds / ระยะเวลา timeout เป็นมิลลิวินาที
 * @returns Response from microservice / การตอบกลับจากไมโครเซอร์วิส
 */
export async function sendToService<T = unknown>(
  client: ClientProxy,
  pattern: Record<string, string>,
  data: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const enrichedData = { ...data, ...getGatewayRequestContext() };

  try {
    return await attemptSend<T>(client, pattern, enrichedData, timeoutMs);
  } catch (error) {
    // On timeout, reconnect and retry once
    if (error instanceof HttpException && error.getStatus() === HttpStatus.GATEWAY_TIMEOUT) {
      logger.log(
        {
          function: 'sendToService',
          pattern,
          message: 'Timeout detected, reconnecting and retrying...',
        },
        'MicroserviceHelper',
      );
      try {
        await client.close();
        await client.connect();
        return await attemptSend<T>(client, pattern, enrichedData, timeoutMs);
      } catch (retryError) {
        if (retryError instanceof HttpException) {
          throw retryError;
        }
        throw new HttpException('Service unavailable after retry', HttpStatus.SERVICE_UNAVAILABLE);
      }
    }

    if (error instanceof HttpException) {
      throw error;
    }

    logger.error(
      {
        function: 'sendToService',
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'MicroserviceHelper',
    );

    throw new HttpException(
      'Service unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Attempt to send a message to a microservice with timeout
 * พยายามส่งข้อความไปยังไมโครเซอร์วิสพร้อม timeout
 * @param client - Microservice client proxy / พร็อกซีไคลเอนต์ไมโครเซอร์วิส
 * @param pattern - Message pattern / รูปแบบข้อความ
 * @param data - Payload data / ข้อมูลที่ส่งไป
 * @param timeoutMs - Timeout in milliseconds / ระยะเวลา timeout เป็นมิลลิวินาที
 * @returns Response from microservice / การตอบกลับจากไมโครเซอร์วิส
 */
async function attemptSend<T>(
  client: ClientProxy,
  pattern: Record<string, string>,
  data: Record<string, unknown>,
  timeoutMs: number,
): Promise<T> {
  const res: Observable<T> = client.send(pattern, data);

  return await firstValueFrom(
    res.pipe(
      timeout(timeoutMs),
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          logger.error(
            {
              function: 'sendToService',
              pattern,
              error: `Service timeout after ${timeoutMs}ms`,
            },
            'MicroserviceHelper',
          );
          return throwError(
            () => new HttpException('Service timeout', HttpStatus.GATEWAY_TIMEOUT),
          );
        }
        return throwError(() => err);
      }),
    ),
  );
}
