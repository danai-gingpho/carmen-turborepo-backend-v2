import { AppError, ErrorCode } from './error';

/**
 * Generic Result type for handling success/error outcomes
 * ประเภท Result ทั่วไปสำหรับจัดการผลลัพธ์สำเร็จ/ข้อผิดพลาด
 */
export class Result<T, E = null> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: AppError<E> | null,
  ) {}

  get value(): T {
    if (this.isError()) {
      throw this._error!;
    }

    return this._value as T;
  }

  get error(): AppError<E> {
    if (this.isOk()) {
      throw new AppError<E>(
        `Result has value: ${this.value}`,
        ErrorCode.INTERNAL,
      );
    }

    return this._error!;
  }

  /**
   * Create a successful Result
   * สร้าง Result ที่สำเร็จ
   */
  static ok<T>(value: T): Result<T, null> {
    return new Result(value, null);
  }

  /**
   * Create an error Result
   * สร้าง Result ที่ผิดพลาด
   */
  static error<E = null>(
    error: AppError<E> | Error | string,
    code: ErrorCode = ErrorCode.INTERNAL,
    data: E = null as E,
  ): Result<null, E> {
    if (error instanceof AppError) {
      return new Result<null, E>(null, error);
    }

    if (error instanceof Error) {
      return new Result<null, E>(
        null,
        new AppError<E>(error.message, code, data),
      );
    }

    const message = typeof error === 'string' ? error : JSON.stringify(error);
    return new Result<null, E>(null, new AppError<E>(message, code, data));
  }

  /**
   * Check if Result is successful
   * ตรวจสอบว่า Result สำเร็จหรือไม่
   */
  isOk(): boolean {
    return this._error === null;
  }

  /**
   * Check if Result is an error
   * ตรวจสอบว่า Result เป็นข้อผิดพลาดหรือไม่
   */
  isError(): boolean {
    return this._error !== null;
  }
}
