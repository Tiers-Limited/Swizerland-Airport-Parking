import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import config from '../config';

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error (in production, use proper logger)
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  // Handle operational errors (expected errors)
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
      code: err.code,
    };

    // Include validation details if present
    if (err.details) {
      response.errors = err.details;
    }

    // Include stack trace in development
    if (config.nodeEnv === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    success: false,
    message: config.nodeEnv === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    code: 'INTERNAL_ERROR',
  };

  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
