import { Request, Response } from 'express';
import { hostService } from '../services/host.service';
import { auditService } from '../services/audit.service';
import { asyncHandler } from '../middleware/error.middleware';
import { RegisterHostInput } from '../validators/auth.validators';
import { VerificationStatus, UserRole } from '../types/roles';
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

const diffFields = (before: object, after: object, keys: string[]) => {
  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const oldValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  for (const key of keys) {
    if (beforeRecord[key] !== afterRecord[key]) {
      oldValues[key] = beforeRecord[key];
      newValues[key] = afterRecord[key];
    }
  }

  return { oldValues, newValues };
};

/**
 * Host Controller
 * Handles host (parking provider) management endpoints
 */
export const hostController = {
  /**
   * POST /api/v1/hosts/register
   * Register as a host
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data: RegisterHostInput = req.body;
    
    const host = await hostService.registerHost(req.user.userId, data);

    // Audit log
    await auditService.log({
      userId: req.user.userId,
      action: 'host.register',
      resource: 'hosts',
      resourceId: host.id,
      newValues: data,
      ipAddress: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: host,
      message: 'Host registration submitted. Pending approval.',
    });
  }),

  /**
   * GET /api/v1/hosts
   * List all hosts (admin only)
   */
  list: asyncHandler(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;
    
    const result = await hostService.list({
      status: status as VerificationStatus,
      page: page ? Number.parseInt(page as string, 10) : 1,
      limit: limit ? Number.parseInt(limit as string, 10) : 20,
    });

    res.json({
      success: true,
      data: result.hosts,
      pagination: {
        page: page ? Number.parseInt(page as string, 10) : 1,
        limit: limit ? Number.parseInt(limit as string, 10) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? Number.parseInt(limit as string, 10) : 20)),
      },
    });
  }),

  /**
   * GET /api/v1/hosts/:id
   * Get host by ID
   */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    
    const host = await hostService.getWithUser(id);

    // Check permission - hosts can only view their own profile unless admin
    if (
      req.user?.role !== UserRole.ADMIN &&
      host.user_id !== req.user?.userId
    ) {
      throw new ForbiddenError('You can only view your own host profile');
    }

    res.json({
      success: true,
      data: host,
    });
  }),

  /**
   * GET /api/v1/hosts/me
   * Get current user's host profile
   */
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const host = await hostService.findByUserId(req.user.userId);

    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered as a host',
      });
    }

    res.json({
      success: true,
      data: host,
    });
  }),

  /**
   * PATCH /api/v1/hosts/profile
   * Update current user's host profile
   */
  updateMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const host = await hostService.findByUserId(req.user.userId);

    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered as a host',
      });
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Host profile changes require admin approval');
    }

    const data: Partial<RegisterHostInput> = req.body;
    const before = await hostService.findByIdOrFail(host.id);
    const updatedHost = await hostService.update(host.id, data);
    const after = await hostService.findByIdOrFail(host.id);
    const { oldValues, newValues } = diffFields(before, after, [
      'company_name',
      'contact_person',
      'company_phone',
      'company_address',
      'bank_iban',
      'mwst_number',
      'commission_rate',
      'facility_options',
      'transfer_service',
      'photos',
      'address',
      'tax_id',
      'phone_number',
      'website',
    ]);

    await auditService.log({
      userId: req.user.userId,
      action: 'host.update',
      resource: 'hosts',
      resourceId: host.id,
      oldValues,
      newValues,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: updatedHost,
      message: 'Host profile updated',
    });
  }),

  /**
   * PATCH /api/v1/hosts/:id
   * Update host profile
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const data: Partial<RegisterHostInput> = req.body;
    
    const host = await hostService.findByIdOrFail(id);

    // Check permission
    if (
      req.user?.role !== UserRole.ADMIN &&
      host.user_id !== req.user?.userId
    ) {
      throw new ForbiddenError('You can only update your own host profile');
    }

    if (req.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Host profile changes require admin approval');
    }

    const updatedHost = await hostService.update(id, data);
    const after = await hostService.findByIdOrFail(id);
    const { oldValues, newValues } = diffFields(host, after, [
      'company_name',
      'contact_person',
      'company_phone',
      'company_address',
      'bank_iban',
      'mwst_number',
      'commission_rate',
      'facility_options',
      'transfer_service',
      'photos',
      'address',
      'tax_id',
      'phone_number',
      'website',
    ]);

    // Audit log
    await auditService.log({
      userId: req.user?.userId,
      action: 'host.update',
      resource: 'hosts',
      resourceId: id,
      oldValues,
      newValues,
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: updatedHost,
      message: 'Host profile updated',
    });
  }),

  /**
   * PATCH /api/v1/hosts/:id/verify
   * Update host verification status (admin only)
   */
  updateVerification: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { status, documentsVerified } = req.body;
    
    const host = await hostService.findByIdOrFail(id);
    const oldStatus = host.verification_status;

    const updatedHost = await hostService.updateVerificationStatus(
      id,
      status,
      documentsVerified
    );

    // Audit log
    await auditService.log({
      userId: req.user?.userId,
      action: 'host.verify',
      resource: 'hosts',
      resourceId: id,
      oldValues: { verification_status: oldStatus },
      newValues: { verification_status: status, documentsVerified },
      ipAddress: getIp(req),
    });

    res.json({
      success: true,
      data: updatedHost,
      message: `Host verification status updated to ${status}`,
    });
  }),

  /**
   * POST /api/v1/hosts/:id/payout-account
   * Set payout account (Stripe Connect)
   */
  setPayoutAccount: asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { payoutAccountId } = req.body;
    
    const host = await hostService.findByIdOrFail(id);

    // Check permission
    if (
      req.user?.role !== UserRole.ADMIN &&
      host.user_id !== req.user?.userId
    ) {
      throw new ForbiddenError('You can only update your own payout account');
    }

    const updatedHost = await hostService.setPayoutAccount(id, payoutAccountId);

    res.json({
      success: true,
      data: updatedHost,
      message: 'Payout account set successfully',
    });
  }),
};
