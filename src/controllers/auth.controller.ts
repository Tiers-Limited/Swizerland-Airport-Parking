import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
  ResetPasswordInput,
  ForgotPasswordInput,
  VerifyEmailInput,
} from '../validators/auth.validators';

// Helper to get IP as string
const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

// Helper to get user agent as string
const getUserAgent = (req: Request): string | undefined => {
  const ua = req.headers['user-agent'];
  return Array.isArray(ua) ? ua[0] : ua;
};

/**
 * Auth Controller
 * Handles all authentication-related endpoints
 */
export const authController = {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const data: RegisterInput = req.body;
    
    const result = await authService.register(data);

    // Log registration
    await auditService.logAuth(
      'register',
      result.user.id,
      getIp(req),
      getUserAgent(req)
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful. Please verify your email.',
    });
  }),

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const data: LoginInput = req.body;
    
    const result = await authService.login(data);

    // Log successful login
    await auditService.logAuth(
      'login',
      result.user.id,
      getIp(req),
      getUserAgent(req)
    );

    res.json({
      success: true,
      data: result,
    });
  }),

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenInput = req.body;
    
    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  }),

  /**
   * POST /api/v1/auth/logout
   * Logout - revoke refresh token
   */
  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenInput = req.body;
    
    await authService.logout(refreshToken);

    // Log logout
    if (req.user) {
      await auditService.logAuth(
        'logout',
        req.user.userId,
        getIp(req),
        getUserAgent(req)
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    await authService.logoutAll(req.user.userId);

    await auditService.logAuth(
      'logout',
      req.user.userId,
      getIp(req),
      getUserAgent(req)
    );

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  }),

  /**
   * POST /api/v1/auth/change-password
   * Change password (authenticated)
   */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data: ChangePasswordInput = req.body;
    
    await authService.changePassword(req.user.userId, data);

    await auditService.logAuth(
      'password_change',
      req.user.userId,
      getIp(req),
      getUserAgent(req)
    );

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  }),

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset email
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email }: ForgotPasswordInput = req.body;
    
    await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent.',
    });
  }),

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword }: ResetPasswordInput = req.body;
    
    await authService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  }),

  /**
   * POST /api/v1/auth/verify-email
   * Verify email with token
   */
  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { token }: VerifyEmailInput = req.body;
    
    await authService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  }),

  /**
   * POST /api/v1/auth/resend-verification
   * Resend verification email (authenticated)
   */
  resendVerification: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    await authService.resendVerificationEmail(req.user.userId);

    res.json({
      success: true,
      message: 'Verification email sent.',
    });
  }),

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { userService } = await import('../services/user.service');
    const user = await userService.getPublicProfile(req.user.userId);

    res.json({
      success: true,
      data: user,
    });
  }),
};
