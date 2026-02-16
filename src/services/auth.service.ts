import { db } from '../database';
import { userService } from './user.service';
import { emailService } from './email.service';
import { User, UserPublic, UserRole, UserStatus, AuthResponse } from '../types';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
  getTokenExpiryDate,
  parseExpiresIn,
  shouldLockAccount,
  calculateLockDuration,
  sanitizeUser,
} from '../utils/auth.utils';
import {
  InvalidCredentialsError,
  InvalidTokenError,
  TokenExpiredError,
  AccountLockedError,
  AccountSuspendedError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import config from '../config';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth.validators';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Create user
    const user = await userService.create(data);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create email verification token and send email
    const { token } = await this.createEmailVerificationToken(user.id);
    
    // Send verification email
    await emailService.sendVerificationEmail({
      email: user.email,
      firstName: user.name,
      verificationToken: token,
    });

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await userService.findByEmail(data.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AccountLockedError(new Date(user.locked_until));
    }

    // Check if account is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new AccountSuspendedError();
    }

    // Check if account is deleted
    if (user.status === UserStatus.DELETED) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password_hash);

    if (!isValid) {
      // Increment failed attempts
      const attempts = await userService.incrementFailedAttempts(user.id);

      // Lock account if too many attempts
      if (shouldLockAccount(attempts)) {
        const lockDuration = calculateLockDuration(attempts);
        const lockedUntil = new Date(Date.now() + lockDuration);
        await userService.lockAccount(user.id, lockedUntil);
        throw new AccountLockedError(lockedUntil);
      }

      throw new InvalidCredentialsError();
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(sanitizeUser(user) as UserPublic);

    return {
      user: sanitizeUser(user) as UserPublic,
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidTokenError('Invalid refresh token');
    }

    // Check if token exists in database and is not revoked
    const tokenHash = hashToken(refreshToken);
    const storedToken = await db('refresh_tokens')
      .where('token_hash', tokenHash)
      .where('revoked', false)
      .where('expires_at', '>', new Date())
      .first();

    if (!storedToken) {
      throw new InvalidTokenError('Refresh token not found or expired');
    }

    // Check if user still exists and is active
    const user = await userService.findById(payload.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new InvalidTokenError('User not found or inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      accessToken,
      expiresIn: parseExpiresIn(config.jwt.expiresIn),
    };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await db('refresh_tokens')
      .where('token_hash', tokenHash)
      .update({
        revoked: true,
        revoked_at: new Date(),
      });
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   */
  async logoutAll(userId: string): Promise<void> {
    await db('refresh_tokens')
      .where('user_id', userId)
      .where('revoked', false)
      .update({
        revoked: true,
        revoked_at: new Date(),
      });
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    const user = await userService.findByIdOrFail(userId);

    // Verify current password
    const isValid = await comparePassword(data.currentPassword, user.password_hash);
    if (!isValid) {
      throw new InvalidCredentialsError('Current password is incorrect');
    }

    // Update password
    await userService.updatePassword(userId, data.newPassword);

    // Revoke all refresh tokens to force re-login
    await this.logoutAll(userId);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ token: string }> {
    const user = await userService.findByEmail(email);

    // Don't reveal if user exists
    if (!user) {
      return { token: '' }; // Silent success
    }

    // Generate reset token
    const token = generateRandomToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing tokens
    await db('password_reset_tokens')
      .where('user_id', user.id)
      .where('used', false)
      .update({ used: true });

    // Store new token
    await db('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used: false,
    });

    // Send password reset email
    await emailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.name,
      resetToken: token,
    });

    return { token };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);

    // Find valid token
    const resetToken = await db('password_reset_tokens')
      .where('token_hash', tokenHash)
      .where('used', false)
      .where('expires_at', '>', new Date())
      .first();

    if (!resetToken) {
      throw new InvalidTokenError('Invalid or expired password reset token');
    }

    // Update password
    await userService.updatePassword(resetToken.user_id, newPassword);

    // Mark token as used
    await db('password_reset_tokens')
      .where('id', resetToken.id)
      .update({ used: true });

    // Revoke all refresh tokens
    await this.logoutAll(resetToken.user_id);
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);

    // Find valid token
    const verificationToken = await db('email_verification_tokens')
      .where('token_hash', tokenHash)
      .where('used', false)
      .where('expires_at', '>', new Date())
      .first();

    if (!verificationToken) {
      throw new InvalidTokenError('Invalid or expired verification token');
    }

    // Get user details for welcome email
    const user = await userService.findByIdOrFail(verificationToken.user_id);

    // Verify email
    await userService.verifyEmail(verificationToken.user_id);

    // Mark token as used
    await db('email_verification_tokens')
      .where('id', verificationToken.id)
      .update({ used: true });

    // Send welcome email
    await emailService.sendWelcomeEmail({
      email: user.email,
      firstName: user.name,
    });
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(userId: string): Promise<{ token: string }> {
    const user = await userService.findByIdOrFail(userId);

    if (user.email_verified) {
      throw new ConflictError('Email already verified');
    }

    const { token } = await this.createEmailVerificationToken(userId);

    // Send verification email
    await emailService.sendVerificationEmail({
      email: user.email,
      firstName: user.name,
      verificationToken: token,
    });

    return { token };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: UserPublic): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const tokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: getTokenExpiryDate(config.jwt.refreshExpiresIn),
      revoked: false,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseExpiresIn(config.jwt.expiresIn),
    };
  }

  /**
   * Create email verification token
   */
  private async createEmailVerificationToken(userId: string): Promise<{ token: string }> {
    const token = generateRandomToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Invalidate existing tokens
    await db('email_verification_tokens')
      .where('user_id', userId)
      .where('used', false)
      .update({ used: true });

    // Store new token
    await db('email_verification_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used: false,
    });

    // In production, send verification email
    return { token };
  }
}

export const authService = new AuthService();
