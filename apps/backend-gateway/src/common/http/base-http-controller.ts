import { Response } from 'express';
import { Result } from '../result/result';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { StdResponse } from '../std-response/std-response';

export interface AuditEnrichmentService {
  enrichIfRequested(payload: unknown): Promise<unknown>;
}

/**
 * Base HTTP controller with standardized response handling.
 * คอนโทรลเลอร์ HTTP พื้นฐานพร้อมการจัดการการตอบกลับมาตรฐาน
 *
 * Audit-user enrichment: when a handler is decorated with @EnrichAuditUsers,
 * the EnrichAuditUsersContextInterceptor stashes options into AsyncLocalStorage.
 * If `BaseHttpController.enrichmentService` is set (wired in app bootstrap),
 * `respond()` will call it on the ok-result `data` before sending.
 */
export abstract class BaseHttpController {
  /** Set during AppModule.onApplicationBootstrap. Null in narrow unit tests. */
  static enrichmentService: AuditEnrichmentService | null = null;

  /**
   * Send a standardized HTTP response from a Result or plain object.
   * Returns Promise<void>; existing call sites do not need to await it.
   */
  protected async respond(
    response: Response,
    result: Result<unknown> | unknown,
    customStatus?: HttpStatus,
  ): Promise<void> {
    if (
      result &&
      typeof result === 'object' &&
      'isOk' in result &&
      typeof (result as { isOk?: unknown }).isOk === 'function'
    ) {
      const typedResult = result as Result<unknown, unknown>;
      const stdResponse = StdResponse.fromResult<unknown, unknown>(typedResult);

      if (typedResult.isOk() && BaseHttpController.enrichmentService) {
        const enriched = await BaseHttpController.enrichmentService.enrichIfRequested(
          (stdResponse as { data: unknown }).data,
        );
        (stdResponse as { data: unknown }).data = enriched;
      }

      const status = typedResult.isOk()
        ? (customStatus ?? stdResponse.status)
        : stdResponse.status;
      response.status(status).send(stdResponse);
      return;
    }

    const status = customStatus ?? (result as { status?: HttpStatus } | null | undefined)?.status ?? HttpStatus.OK;
    response.status(status).send(result);
  }
}
