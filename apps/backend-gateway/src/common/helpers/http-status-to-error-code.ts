import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@/common';

export function httpStatusToErrorCode(status: HttpStatus): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.INVALID_ARGUMENT;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHENTICATED;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.PERMISSION_DENIED;
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return ErrorCode.VALIDATION_FAILURE;
    case HttpStatus.CONFLICT:
      return ErrorCode.ALREADY_EXISTS;
    default:
      return ErrorCode.INTERNAL;
  }
}
