import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.utils';
import { AuthenticationError, InvalidTokenError, TokenExpiredError } from '../utils/errors';
import { JwtPayload } from '../types';
import { JsonWebTokenError, TokenExpiredError as JwtTokenExpiredError } from 'jsonwebtoken';

/**
 * Authentication middleware - validates JWT access token
 * Extracts user info from token and attaches to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Invalid authorization header format. Use: Bearer <token>');
    }

    const token = parts[1];
    
    try {
      const decoded: JwtPayload = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof JwtTokenExpiredError) {
        throw new TokenExpiredError();
      }
      if (error instanceof JsonWebTokenError) {
        throw new InvalidTokenError();
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that behave differently for authenticated users
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    
    try {
      const decoded: JwtPayload = verifyAccessToken(token);
      req.user = decoded;
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
