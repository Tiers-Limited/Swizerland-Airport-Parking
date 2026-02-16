import { db } from '../database';
import { AuditLog } from '../types';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private readonly tableName = 'audit_logs';

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    await db(this.tableName).insert({
      user_id: data.userId || null,
      action: data.action,
      resource: data.resource,
      resource_id: data.resourceId || null,
      old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
      new_values: data.newValues ? JSON.stringify(data.newValues) : null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
    });
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: 'login' | 'logout' | 'register' | 'password_change' | 'password_reset',
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      userId,
      action: `auth.${action}${success ? '' : '.failed'}`,
      resource: 'users',
      resourceId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log role changes
   */
  async logRoleChange(
    userId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'role.change',
      resource: 'users',
      resourceId: targetUserId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      ipAddress,
    });
  }

  /**
   * Log status changes
   */
  async logStatusChange(
    userId: string,
    targetUserId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'status.change',
      resource: 'users',
      resourceId: targetUserId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus, reason },
      ipAddress,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getByUserId(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const [{ count }] = await db(this.tableName)
      .where('user_id', userId)
      .count('* as count');

    const logs = await db(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      logs,
      total: parseInt(count as string, 10),
    };
  }

  /**
   * Get audit logs for a specific resource
   */
  async getByResource(
    resource: string,
    resourceId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const [{ count }] = await db(this.tableName)
      .where('resource', resource)
      .where('resource_id', resourceId)
      .count('* as count');

    const logs = await db(this.tableName)
      .where('resource', resource)
      .where('resource_id', resourceId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      logs,
      total: parseInt(count as string, 10),
    };
  }

  /**
   * Search audit logs (admin)
   */
  async search(filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let query = db(this.tableName);

    if (filters.userId) {
      query = query.where('user_id', filters.userId);
    }
    if (filters.resource) {
      query = query.where('resource', filters.resource);
    }
    if (filters.action) {
      query = query.where('action', 'like', `%${filters.action}%`);
    }
    if (filters.startDate) {
      query = query.where('created_at', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('created_at', '<=', filters.endDate);
    }

    const [{ count }] = await query.clone().count('* as count');

    const logs = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      logs,
      total: parseInt(count as string, 10),
    };
  }
}

export const auditService = new AuditService();
