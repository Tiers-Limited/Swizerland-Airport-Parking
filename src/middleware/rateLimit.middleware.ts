import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import config from '../config';
import { RateLimitError } from '../utils/errors';

/**
 * Helper to normalize IP address (handles IPv6 properly)
 */
const normalizeIp = (req: Request): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Normalize IPv6 localhost to IPv4 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  // Remove IPv6 prefix if present
  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return Array.isArray(ip) ? ip[0] : ip;
};

/**
 * Request ID middleware - adds unique ID to each request
 */
export const requestId = (req: Request, _res: Response, next: NextFunction): void => {
  req.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms - ${req.requestId}`
    );
  });
  
  next();
};

/**
 * Default rate limiter - general API protection
 */
export const defaultRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  handler: (_req, _res, next) => {
    next(new RateLimitError());
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many authentication attempts, please try again later'));
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination for login attempts
    const ip = normalizeIp(req);
    const email = req.body?.email || '';
    return `${ip}-${email}`;
  },
  validate: { xForwardedForHeader: false },
});

/**
 * Very strict rate limiter for password reset
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset requests, please try again later',
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many password reset requests, please try again later'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});
