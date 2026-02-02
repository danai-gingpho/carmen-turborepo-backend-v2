import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { Result } from '../result/result';
import { StdStatus } from '../std-response/std-status';

export interface MicroserviceResponse<T = any> {
  data?: T;
  paginate?: {
    total: number;
    page: number;
    perpage: number;
    pages: number;
  };
  response: {
    status: HttpStatus;
    message: string;
    timestamp: string;
  };
}

export abstract class BaseMicroserviceController {
  protected handleResultCrate<T>(
    result: Result<T, any>,
    successStatus: HttpStatus = HttpStatus.CREATED,
  ): MicroserviceResponse<T> {
    if (result.isOk()) {
      return {
        data: result.value,
        response: {
          status: successStatus,
          message: 'Created Successfully',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const error = result.error;
    return {
      response: {
        status: this.fromStdStatus(this.errorCodeToStdStatus(error.code)),
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  protected handleResult<T>(
    result: Result<T, any>,
    successStatus: HttpStatus = HttpStatus.OK,
  ): MicroserviceResponse<T> {
    if (result.isOk()) {
      return {
        data: result.value,
        response: {
          status: successStatus,
          message: 'Success',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const error = result.error;
    return {
      response: {
        status: this.fromStdStatus(this.errorCodeToStdStatus(error.code)),
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  protected handleMultiPaginatedResult<T>(
    result: Result<any[], any>,
  ): MicroserviceResponse<T[]> {
    if (result.isOk()) {
      return {
        data: result.value,
        response: {
          status: HttpStatus.OK,
          message: 'Success',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const error = result.error;
    return {
      response: {
        status: this.fromStdStatus(this.errorCodeToStdStatus(error.code)),
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  protected handlePaginatedResult<T>(
    result: Result<{ paginate: any; data: T[] }, any>,
  ): MicroserviceResponse<T[]> {
    if (result.isOk()) {
      const paginate = result.value.paginate;
      const data = result.value.data;

      return {
        paginate,
        data,
        response: {
          status: HttpStatus.OK,
          message: 'Success',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const error = result.error;
    return {
      response: {
        status: this.fromStdStatus(this.errorCodeToStdStatus(error.code)),
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private errorCodeToStdStatus(code: number): StdStatus {
    const statusMap: Record<number, StdStatus> = {
      1: StdStatus.INVALID_ARGUMENT,
      2: StdStatus.UNAUTHENTICATED,
      3: StdStatus.NOT_FOUND,
      4: StdStatus.PERMISSION_DENIED,
      5: StdStatus.VALIDATION_FAILURE,
      6: StdStatus.ALREADY_EXISTS,
      7: StdStatus.INTERNAL_ERROR,
    };
    return statusMap[code] ?? StdStatus.INTERNAL_ERROR;
  }

  private fromStdStatus(status: StdStatus): HttpStatus {
    switch (status) {
      case StdStatus.SUCCESS:
        return HttpStatus.OK;
      case StdStatus.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST;
      case StdStatus.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case StdStatus.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED;
      case StdStatus.PERMISSION_DENIED:
        return HttpStatus.FORBIDDEN;
      case StdStatus.VALIDATION_FAILURE:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case StdStatus.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case StdStatus.INTERNAL_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
