import { Result } from '../result/result';
import { ErrorCode } from '../result/error';

/**
 * Standard API response wrapper with pagination support
 * ตัวห่อการตอบกลับ API มาตรฐานพร้อมรองรับการแบ่งหน้า
 */
export class StdResponse<T = unknown> {
  constructor(
    public readonly data: T | null,
    public readonly paginate: {
      total: number;
      page: number;
      perpage: number;
      pages: number;
    } | null,
    public readonly status: number,
    public readonly success: boolean,
    public readonly message: string,
    public readonly timestamp: string,
  ) {}

  /**
   * Create a successful response
   * สร้างการตอบกลับที่สำเร็จ
   */
  static success<T>(data?: T): StdResponse<T> {
    return new StdResponse(
      data ?? null,
      null,
      200,
      true,
      'Success',
      new Date().toISOString(),
    );
  }

  /**
   * Create a successful paginated response
   * สร้างการตอบกลับที่สำเร็จแบบแบ่งหน้า
   */
  static successPaginated<T>(
    data: T[],
    paginate: { total: number; page: number; perpage: number; pages: number },
  ): StdResponse<T[]> {
    return new StdResponse(
      data,
      paginate,
      200,
      true,
      'Success',
      new Date().toISOString(),
    );
  }

  /**
   * Create an error response
   * สร้างการตอบกลับที่ผิดพลาด
   */
  static error(status: number, message: string): StdResponse<null> {
    return new StdResponse(
      null,
      null,
      status,
      false,
      message,
      new Date().toISOString(),
    );
  }

  /**
   * Create a response from a Result object
   * สร้างการตอบกลับจากอ็อบเจกต์ Result
   */
  static fromResult<T, E>(result: Result<T, E>): StdResponse<T> {
    if (result.isOk()) {
      const value = result.value as unknown;
      // Check if this is a paginated result
      if (value && typeof value === 'object' && 'paginate' in value && 'data' in value && Array.isArray((value as any).data)) {
        const paginatedValue = value as { data: unknown[]; paginate: { total: number; page: number; perpage: number; pages: number } };
        return StdResponse.successPaginated(paginatedValue.data, paginatedValue.paginate) as unknown as StdResponse<T>;
      }
      return StdResponse.success(result.value);
    }

    const error = result.error;
    const status = StdResponse.errorCodeToHttpStatus(error.code);
    return StdResponse.error(status, error.message);
  }

  private static errorCodeToHttpStatus(code: ErrorCode): number {
    const statusMap: Record<ErrorCode, number> = {
      [ErrorCode.INVALID_ARGUMENT]: 400,
      [ErrorCode.UNAUTHENTICATED]: 401,
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.PERMISSION_DENIED]: 403,
      [ErrorCode.VALIDATION_FAILURE]: 422,
      [ErrorCode.ALREADY_EXISTS]: 409,
      [ErrorCode.INTERNAL]: 500,
    };
    return statusMap[code] ?? 500;
  }

  /**
   * Serialize response to JSON format
   * แปลงการตอบกลับเป็นรูปแบบ JSON
   */
  toJSON() {
    const result: Record<string, unknown> = {
      data: this.data,
      status: this.status,
      success: this.success,
      message: this.message,
      timestamp: this.timestamp,
    };

    if (this.paginate !== null) {
      result.paginate = this.paginate;
    }

    return result;
  }
}
