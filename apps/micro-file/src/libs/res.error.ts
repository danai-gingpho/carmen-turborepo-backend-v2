import { HttpStatus, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * Standard API response utilities for NestJS microservices
 * Provides consistent error handling and success responses
 */

// Response interfaces matching GlobalApiReturn pattern
export interface ApiResponse<T = any> {
  success?: boolean;
  response: {
    status: number;
    message?: string;
  };
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    perpage: number;
    pages: number;
  };
}

// ============================================
// Success Response Functions
// ============================================

/**
 * Creates a standard success response
 */
export const resSuccess = <T = any>(
  data?: T,
  message: string = 'Success',
): ApiResponse<T> => ({
  success: true,
  response: { status: HttpStatus.OK, message },
  data,
  message,
});

/**
 * Creates a success response with data
 */
export const resSuccessWithData = <T = any>(
  data: T,
  message: string = 'Success',
): ApiResponse<T> => ({
  success: true,
  response: { status: HttpStatus.OK, message },
  data,
  message,
});

/**
 * Creates a success response for resource creation
 */
export const resCreated = <T = any>(
  data: T,
  message: string = 'Resource created successfully',
): ApiResponse<T> => ({
  success: true,
  response: { status: HttpStatus.CREATED, message },
  data,
  message,
});

/**
 * Creates a success response with pagination
 */
export const resSuccessWithPaginate = <T = any>(
  data: T[],
  total: number,
  page: number,
  perpage: number,
  message: string = 'Success',
) => ({
  success: true,
  status: HttpStatus.OK,
  response: { status: HttpStatus.OK, message },
  data,
  message,
  meta: {
    total,
    page,
    perpage,
    pages: Math.ceil(total / perpage),
  },
  pagination: {
    total,
    page,
    perpage,
    pages: Math.ceil(total / perpage),
  },
});

/**
 * Creates a no content response
 */
export const resNoContent = (message: string = 'No content'): ApiResponse => ({
  response: { status: HttpStatus.NO_CONTENT, message },
  message,
});

// ============================================
// Error Response Functions
// ============================================

/**
 * Creates a bad request error response (400)
 */
export const resBadRequest = (message: string = 'Bad Request'): ApiResponse => ({
  response: { status: HttpStatus.BAD_REQUEST, message },
  message,
});

/**
 * Creates an unauthorized error response (401)
 */
export const resUnauthorized = (message: string = 'Unauthorized'): ApiResponse => ({
  response: { status: HttpStatus.UNAUTHORIZED, message },
  message,
});

/**
 * Creates a forbidden error response (403)
 */
export const resForbidden = (message: string = 'Forbidden'): ApiResponse => ({
  response: { status: HttpStatus.FORBIDDEN, message },
  message,
});

/**
 * Creates a not found error response (404)
 */
export const resNotFound = (message: string = 'Resource not found'): ApiResponse => ({
  response: { status: HttpStatus.NOT_FOUND, message },
  message,
});

/**
 * Creates a conflict error response (409)
 */
export const resConflict = (message: string = 'Resource conflict'): ApiResponse => ({
  response: { status: HttpStatus.CONFLICT, message },
  message,
});

/**
 * Creates an unprocessable entity error response (422)
 */
export const resUnprocessableEntity = (
  message: string = 'Unprocessable entity',
): ApiResponse => ({
  response: { status: HttpStatus.UNPROCESSABLE_ENTITY, message },
  message,
});

/**
 * Creates an internal server error response (500)
 */
export const resInternalServerError = (
  message: string = 'Internal server error',
): ApiResponse => ({
  response: { status: HttpStatus.INTERNAL_SERVER_ERROR, message },
  message,
});

/**
 * Creates a generic error response with custom status code
 */
export const resError = (
  status: number,
  message: string = 'An error occurred',
): ApiResponse => ({
  response: { status, message },
  message,
});

/**
 * Creates an error response with additional data
 */
export const resErrorWithData = <T = any>(
  status: number,
  message: string,
  data: T,
): ApiResponse<T> => ({
  response: { status, message },
  data,
  message,
});

// ============================================
// Exception Helpers (for throwing)
// ============================================

/**
 * Throws a BadRequest HttpException
 */
export const throwBadRequest = (message: string = 'Bad Request'): never => {
  throw new HttpException(message, HttpStatus.BAD_REQUEST);
};

/**
 * Throws an Unauthorized HttpException
 */
export const throwUnauthorized = (message: string = 'Unauthorized'): never => {
  throw new HttpException(message, HttpStatus.UNAUTHORIZED);
};

/**
 * Throws a Forbidden HttpException
 */
export const throwForbidden = (message: string = 'Forbidden'): never => {
  throw new HttpException(message, HttpStatus.FORBIDDEN);
};

/**
 * Throws a NotFound HttpException
 */
export const throwNotFound = (message: string = 'Resource not found'): never => {
  throw new HttpException(message, HttpStatus.NOT_FOUND);
};

/**
 * Throws a Conflict HttpException
 */
export const throwConflict = (message: string = 'Resource conflict'): never => {
  throw new HttpException(message, HttpStatus.CONFLICT);
};

/**
 * Throws an UnprocessableEntity HttpException
 */
export const throwUnprocessableEntity = (
  message: string = 'Unprocessable entity',
): never => {
  throw new HttpException(message, HttpStatus.UNPROCESSABLE_ENTITY);
};

/**
 * Throws an InternalServerError HttpException
 */
export const throwInternalServerError = (
  message: string = 'Internal server error',
): never => {
  throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
};

/**
 * Throws an RpcException for microservice communication
 */
export const throwRpcException = (
  message: string,
  status: number = HttpStatus.INTERNAL_SERVER_ERROR,
): never => {
  throw new RpcException({ message, status });
};

// ============================================
// Utility Functions
// ============================================

/**
 * Checks if response indicates an error
 */
export const isErrorResponse = (response: ApiResponse): boolean => {
  return response.response.status >= 400;
};

/**
 * Checks if response indicates success
 */
export const isSuccessResponse = (response: ApiResponse): boolean => {
  return response.response.status >= 200 && response.response.status < 300;
};
