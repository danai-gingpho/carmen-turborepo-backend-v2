import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { Result } from '../result/result';
import { StdResponse } from '../std-response/std-response';
import { StdStatus } from '../std-response/std-status';

export interface MicroserviceResponse<T = unknown> {
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
  /**
   * Handle a Result object and return a microservice response for create operations
   * จัดการ Result object และส่งคืน response สำหรับการสร้างข้อมูล
   * @param result - Result object containing success or error / Result object ที่มีผลสำเร็จหรือข้อผิดพลาด
   * @param successStatus - HTTP status for success (default: CREATED) / สถานะ HTTP สำหรับสำเร็จ (ค่าเริ่มต้น: CREATED)
   * @returns Microservice response / response ของ microservice
   */
  protected handleResultCrate<T>(
    result: Result<T, unknown>,
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

  /**
   * Handle a Result object and return a standard microservice response
   * จัดการ Result object และส่งคืน response มาตรฐานของ microservice
   * @param result - Result object containing success or error / Result object ที่มีผลสำเร็จหรือข้อผิดพลาด
   * @param successStatus - HTTP status for success (default: OK) / สถานะ HTTP สำหรับสำเร็จ (ค่าเริ่มต้น: OK)
   * @returns Microservice response / response ของ microservice
   */
  protected handleResult<T>(
    result: Result<T, unknown>,
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

  /**
   * Handle a Result object containing multiple items and return a paginated response
   * จัดการ Result object ที่มีข้อมูลหลายรายการและส่งคืน response แบบแบ่งหน้า
   * @param result - Result object containing array data / Result object ที่มีข้อมูลแบบอาร์เรย์
   * @returns Paginated microservice response / response แบบแบ่งหน้าของ microservice
   */
  protected handleMultiPaginatedResult<T>(
    result: Result<unknown[], unknown>,
  ): MicroserviceResponse<T[]> {
    if (result.isOk()) {
      // console.log('Multi Paginated Result Value:', result.value);
      return {
        data: result.value as T[],
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

  /**
   * Handle a Result object with pagination metadata and return a paginated response
   * จัดการ Result object ที่มีข้อมูลการแบ่งหน้าและส่งคืน response แบบแบ่งหน้า
   * @param result - Result object containing paginated data / Result object ที่มีข้อมูลแบบแบ่งหน้า
   * @returns Paginated microservice response with pagination info / response แบบแบ่งหน้าพร้อมข้อมูลการแบ่งหน้า
   */
  protected handlePaginatedResult<T>(
    result: Result<{ paginate: { total: number; page: number; perpage: number; pages: number }; data: T[] }, unknown>,
  ): MicroserviceResponse<T[]> {
    if (result.isOk()) {
      // console.log('Paginated Result Value:', result.value);
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
