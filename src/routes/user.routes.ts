import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, isAdmin } from '../middleware/rbac.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { UserRole } from '../types/roles';
import {
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  userListFiltersSchema,
  uuidSchema,
} from '../validators/auth.validators';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    List all users with filters
 * @access  Admin only
 */
router.get(
  '/',
  isAdmin,
  validateQuery(userListFiltersSchema),
  userController.list
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Admin or own profile
 */
router.get(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  userController.getById
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user profile
 * @access  Admin or own profile
 */
router.patch(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  validateBody(updateUserSchema),
  userController.update
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Update user status (suspend/activate)
 * @access  Admin only
 */
router.patch(
  '/:id/status',
  isAdmin,
  validateParams(z.object({ id: uuidSchema })),
  validateBody(updateUserStatusSchema),
  userController.updateStatus
);

/**
 * @route   PATCH /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 */
router.patch(
  '/:id/role',
  isAdmin,
  validateParams(z.object({ id: uuidSchema })),
  validateBody(updateUserRoleSchema),
  userController.updateRole
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Admin only
 */
router.delete(
  '/:id',
  isAdmin,
  validateParams(z.object({ id: uuidSchema })),
  userController.delete
);

/**
 * @route   GET /api/v1/users/:id/audit-logs
 * @desc    Get audit logs for a user
 * @access  Admin only
 */
router.get(
  '/:id/audit-logs',
  isAdmin,
  validateParams(z.object({ id: uuidSchema })),
  userController.getAuditLogs
);

export default router;
