import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validators';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  authController.refresh
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout (revoke refresh token)
 * @access  Public
 */
router.post(
  '/logout',
  optionalAuth,
  validateBody(refreshTokenSchema),
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post(
  '/resend-verification',
  authenticate,
  authController.resendVerification
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.me
);

export default router;
