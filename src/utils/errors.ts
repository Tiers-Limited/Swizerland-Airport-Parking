// Custom Error Classes for API

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: string = 'AUTH_REQUIRED') {
    super(message, 401, code);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid email or password. Please check your credentials and try again.') {
    super(message, 401, 'INVALID_CREDENTIALS');
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

// Authorization Errors
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(resource: string, action: string) {
    super(`Insufficient permissions to ${action} ${resource}`, 403, 'INSUFFICIENT_PERMISSIONS');
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

// Rate Limiting Error
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Account Errors
export class AccountLockedError extends AppError {
  constructor(lockedUntil: Date) {
    super(
      `Account is temporarily locked. Try again after ${lockedUntil.toISOString()}`,
      423,
      'ACCOUNT_LOCKED'
    );
  }
}

export class AccountSuspendedError extends AppError {
  constructor(message: string = 'Account has been suspended') {
    super(message, 403, 'ACCOUNT_SUSPENDED');
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message: string = 'Email address not verified') {
    super(message, 403, 'EMAIL_NOT_VERIFIED');
  }
}
