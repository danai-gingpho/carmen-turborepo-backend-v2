import { Result } from '../result/result';
import { ErrorCode } from '../result/error';

export class StdResponse<T = any> {
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

  static fromResult<T, E>(result: Result<T, E>): StdResponse<T> {
    if (result.isOk()) {
      const value = result.value as any;
      // Check if this is a paginated result
      if (value && typeof value === 'object' && 'paginate' in value && 'data' in value && Array.isArray(value.data)) {
        return StdResponse.successPaginated(value.data, value.paginate) as unknown as StdResponse<T>;
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

  toJSON() {
    const result: Record<string, any> = {
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
