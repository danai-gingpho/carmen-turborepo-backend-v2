import { Response } from 'express';
import { Result } from '../result/result';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { StdResponse } from '../std-response/std-response';

export abstract class BaseHttpController {
  protected respond(
    response: Response,
    result: Result<any> | any,
    customStatus?: HttpStatus,
  ) {
    // Check if result is a Result object (has isOk method)
    if (result && typeof result.isOk === 'function') {
      const stdResponse = StdResponse.fromResult<any, any>(result);
      const status = customStatus ?? stdResponse.status;
      response.status(status).send(stdResponse);
    } else {
      // Handle plain response objects (legacy ResponseLib format)
      const status = customStatus ?? result?.status ?? HttpStatus.OK;
      response.status(status).send(result);
    }
  }
}
