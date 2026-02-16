import { Router } from 'express';
import { hostController } from '../controllers/host.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { UserRole, VerificationStatus } from '../types/roles';
import { registerHostSchema, uuidSchema } from '../validators/auth.validators';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/hosts/register
 * @desc    Register as a host
 * @access  Any authenticated user (customers can become hosts)
 */
router.post(
  '/register',
  validateBody(registerHostSchema),
  hostController.register
);

/**
 * @route   GET /api/v1/hosts
 * @desc    List all hosts
 * @access  Admin only
 */
router.get(
  '/',
  isAdmin,
  hostController.list
);

/**
 * @route   GET /api/v1/hosts/me
 * @desc    Get current user's host profile
 * @access  Hosts only
 */
router.get(
  '/me',
  requireRole(UserRole.HOST, UserRole.ADMIN),
  hostController.getMe
);

/**
 * @route   GET /api/v1/hosts/:id
 * @desc    Get host by ID
 * @access  Admin or own profile
 */
router.get(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  hostController.getById
);

/**
 * @route   PATCH /api/v1/hosts/:id
 * @desc    Update host profile
 * @access  Admin or own profile
 */
router.patch(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(registerHostSchema.partial()),
  hostController.update
);

/**
 * @route   PATCH /api/v1/hosts/:id/verify
 * @desc    Update host verification status
 * @access  Admin only
 */
router.patch(
  '/:id/verify',
  isAdmin,
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({
    status: z.nativeEnum(VerificationStatus),
    documentsVerified: z.boolean().optional(),
  })),
  hostController.updateVerification
);

/**
 * @route   POST /api/v1/hosts/:id/payout-account
 * @desc    Set payout account (Stripe Connect)
 * @access  Admin or own profile
 */
router.post(
  '/:id/payout-account',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(z.object({
    payoutAccountId: z.string().min(1),
  })),
  hostController.setPayoutAccount
);

export default router;
