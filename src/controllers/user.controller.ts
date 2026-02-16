import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { UserStatus, UserRole } from '../types/roles';
import {
  UpdateUserInput,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
  UserListFiltersInput,
} from '../validators/auth.validators';
import { ForbiddenError } from '../utils/errors';

// Helper to get IP as string
const getIp = (req: Request): string | undefined => {
  const ip = req.ip;
  return Array.isArray(ip) ? ip[0] : ip;
};

// Helper to get param ID as string
const getId = (req: Request): string => {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
};

/**
 * User Controller
 * Handles user management endpoints
 */
export const userController = {
  /**
   * GET /api/v1/users
   * List all users (admin only)
   */
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters: UserListFiltersInput = req.query as unknown as UserListFiltersInput;
    
    const result = await userService.list(filters);

    res.json({
      success: true,
      data: result.users,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (filters.limit || 20)),
      },
    });
  }),

  /**
   * GET /api/v1/users/:id
   * Get user by ID
   */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    
    // Check permission - users can only view their own profile unless admin
    if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== id) {
      throw new ForbiddenError('You can only view your own profile');
    }

    const user = await userService.getPublicProfile(id);

    res.json({
      success: true,
      data: user,
    });
  }),

  /**
   * PATCH /api/v1/users/:id
   * Update user profile
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const data: UpdateUserInput = req.body;
    
    // Check permission - users can only update their own profile unless admin
    if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const updatedUser = await userService.update(id, data);

    // Audit log
    await auditService.log({
      userId: req.user?.userId,
      action: 'user.update',
      resource: 'users',
      resourceId: id,
      newValues: data,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  }),

  /**
   * PATCH /api/v1/users/:id/status
   * Update user status (admin only)
   */
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { status, reason }: UpdateUserStatusInput = req.body;
    
    const currentUser = await userService.findByIdOrFail(id);
    const oldStatus = currentUser.status;

    const updatedUser = await userService.updateStatus(
      id,
      status === 'active' ? UserStatus.ACTIVE : UserStatus.SUSPENDED
    );

    // Audit log
    await auditService.logStatusChange(
      req.user!.userId,
      id,
      oldStatus,
      status,
      reason,
      getIp(req)
    );

    res.json({
      success: true,
      data: updatedUser,
      message: `User status updated to ${status}`,
    });
  }),

  /**
   * PATCH /api/v1/users/:id/role
   * Update user role (admin only)
   */
  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { role }: UpdateUserRoleInput = req.body;
    
    const currentUser = await userService.findByIdOrFail(id);
    const oldRole = currentUser.role;

    // Prevent demoting yourself
    if (req.user?.userId === id && role !== UserRole.ADMIN) {
      throw new ForbiddenError('You cannot demote yourself');
    }

    const updatedUser = await userService.updateRole(id, role);

    // Audit log
    await auditService.logRoleChange(
      req.user!.userId,
      id,
      oldRole,
      role,
      getIp(req)
    );

    res.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${role}`,
    });
  }),

  /**
   * DELETE /api/v1/users/:id
   * Delete user (soft delete, admin only)
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    
    // Prevent self-deletion
    if (req.user?.userId === id) {
      throw new ForbiddenError('You cannot delete yourself');
    }

    await userService.delete(id);

    // Audit log
    await auditService.log({
      userId: req.user?.userId,
      action: 'user.delete',
      resource: 'users',
      resourceId: id,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  }),

  /**
   * GET /api/v1/users/:id/audit-logs
   * Get audit logs for a user (admin only)
   */
  getAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { page, limit } = req.query;
    
    const result = await auditService.getByUserId(id, {
      page: page ? Number.parseInt(page as string, 10) : 1,
      limit: limit ? Number.parseInt(limit as string, 10) : 50,
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: page ? Number.parseInt(page as string, 10) : 1,
        limit: limit ? Number.parseInt(limit as string, 10) : 50,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? Number.parseInt(limit as string, 10) : 50)),
      },
    });
  }),
};
