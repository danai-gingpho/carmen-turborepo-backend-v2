export enum ErrorCode {
  INVALID_ARGUMENT = 1,
  UNAUTHENTICATED = 2,
  NOT_FOUND = 3,
  PERMISSION_DENIED = 4,
  VALIDATION_FAILURE = 5,
  ALREADY_EXISTS = 6,
  INTERNAL = 7,
}

/**
 * Application error with error code and optional data
 * ข้อผิดพลาดของแอปพลิเคชันพร้อมรหัสข้อผิดพลาดและข้อมูลเพิ่มเติม
 */
export class AppError<T = undefined> extends Error {
  constructor(
    message: string,
    readonly code: ErrorCode,
    readonly data?: T,
  ) {
    super(message);
    this.name = AppError.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
