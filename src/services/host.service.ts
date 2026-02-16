import { db } from '../database';
import { userService } from './user.service';
import { Host, UserRole, VerificationStatus, HostType } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';

import { RegisterHostInput } from '../validators/auth.validators';

export class HostService {
  private readonly tableName = 'hosts';

  /**
   * Register as a host (requires existing customer account)
   */
  async registerHost(userId: string, data: RegisterHostInput): Promise<Host> {
    // const user = await userService.findByIdOrFail(userId);

    // Check if already a host
    const existingHost = await this.findByUserId(userId);
    if (existingHost) {
      throw new ConflictError('User is already registered as a host');
    }

    // Create host profile
    const [host] = await db(this.tableName)
      .insert({
        user_id: userId,
        company_name: data.companyName,
        host_type: data.hostType,
        tax_id: data.taxId,
        address: data.address,
        website: data.website,
        verification_status: VerificationStatus.PENDING,
        documents_verified: false,
      })
      .returning('*');

    // Update user role to host
    await userService.updateRole(userId, UserRole.HOST);

    return host;
  }

  /**
   * Find host by ID
   */
  async findById(id: string): Promise<Host | null> {
    const host = await db(this.tableName).where('id', id).first();
    return host || null;
  }

  /**
   * Find host by user ID
   */
  async findByUserId(userId: string): Promise<Host | null> {
    const host = await db(this.tableName).where('user_id', userId).first();
    return host || null;
  }

  /**
   * Find host by ID or throw error
   */
  async findByIdOrFail(id: string): Promise<Host> {
    const host = await this.findById(id);
    if (!host) {
      throw new NotFoundError('Host');
    }
    return host;
  }

  /**
   * Update host profile
   */
  async update(id: string, data: Partial<RegisterHostInput>): Promise<Host> {
    await this.findByIdOrFail(id);

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  /**
   * Update verification status (admin only)
   */
  async updateVerificationStatus(
    id: string,
    status: VerificationStatus,
    documentsVerified?: boolean
  ): Promise<Host> {
    await this.findByIdOrFail(id);

    const updateData: Partial<Host> = {
      verification_status: status,
      updated_at: new Date(),
    };

    if (documentsVerified !== undefined) {
      updateData.documents_verified = documentsVerified;
    }

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update(updateData)
      .returning('*');

    return updated;
  }

  /**
   * Set payout account (Stripe Connect)
   */
  async setPayoutAccount(id: string, payoutAccountId: string): Promise<Host> {
    await this.findByIdOrFail(id);

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update({
        payout_account_id: payoutAccountId,
        updated_at: new Date(),
      })
      .returning('*');

    return updated;
  }

  /**
   * List hosts with filters
   */
  async list(filters: {
    status?: VerificationStatus;
    hostType?: HostType;
    page?: number;
    limit?: number;
  }): Promise<{ hosts: Host[]; total: number }> {
    const { status, hostType, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db(this.tableName);

    if (status) {
      query = query.where('verification_status', status);
    }
    if (hostType) {
      query = query.where('host_type', hostType);
    }

    const [{ count }] = await query.clone().count('* as count');
    const total = Number.parseInt(count as string, 10);

    const hosts = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { hosts, total };
  }

  /**
   * Get host with user details
   */
  async getWithUser(id: string): Promise<Host & { user: unknown }> {
    const host = await db(this.tableName)
      .where(`${this.tableName}.id`, id)
      .leftJoin('users', 'users.id', `${this.tableName}.user_id`)
      .select(
        `${this.tableName}.*`,
        'users.name as user_name',
        'users.email as user_email',
        'users.phone as user_phone',
        'users.status as user_status'
      )
      .first();

    if (!host) {
      throw new NotFoundError('Host');
    }

    return host;
  }
}

export const hostService = new HostService();
