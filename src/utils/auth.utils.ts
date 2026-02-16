import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { JwtPayload, UserRole } from '../types';

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Generation
export function generateAccessToken(payload: {
  userId: string;
  role: UserRole;
  email: string;
}): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: {
  userId: string;
  role: UserRole;
  email: string;
}): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

// Token Hashing (for storing refresh tokens securely)
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Random Token Generation
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Booking Code Generation (human-readable)
export function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Parse JWT expiry string to milliseconds
export function parseExpiresIn(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);
  
  switch (unit) {
    case 's': return value * 1000; // seconds
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return value * 1000;
  }
}

// Get token expiration date
export function getTokenExpiryDate(expiresIn: string): Date {
  const ms = parseExpiresIn(expiresIn);
  return new Date(Date.now() + ms);
}

// Sanitize user output (remove sensitive fields)
export function sanitizeUser<T extends { password_hash?: unknown }>(user: T): Omit<T, 'password_hash'> {
  const { password_hash: _removed, ...sanitized } = user;
  return sanitized;
}

// Calculate lock duration based on failed attempts
export function calculateLockDuration(failedAttempts: number): number {
  // Progressive lockout: 1 min, 5 min, 15 min, 1 hour...
  const baseDuration = 60 * 1000; // 1 minute
  const multiplier = Math.min(Math.pow(2, failedAttempts - 3), 60); // Max 1 hour
  return baseDuration * multiplier;
}

// Check if account should be locked
export function shouldLockAccount(failedAttempts: number): boolean {
  return failedAttempts >= 5;
}
