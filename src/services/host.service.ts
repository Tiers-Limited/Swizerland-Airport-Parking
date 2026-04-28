import { db } from '../database';
import { emailService } from './email.service';
import { Host, UserRole, VerificationStatus } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';

import { RegisterHostInput } from '../validators/auth.validators';

export class HostService {
  private readonly tableName = 'hosts';

  /**
   * Register as a host (requires existing customer account)
   */
  async registerHost(userId: string, data: RegisterHostInput): Promise<Host> {
    // Check if already a host
    const existingHost = await this.findByUserId(userId);
    if (existingHost) {
      throw new ConflictError('User is already registered as a host');
    }

    // Create host profile
    let facilityOptions = '{}';
    if (Array.isArray(data.facilityOptions)) {
      facilityOptions = JSON.stringify(Object.fromEntries(data.facilityOptions.map((item) => [item, true])));
    } else if (data.facilityOptions) {
      facilityOptions = JSON.stringify(data.facilityOptions);
    }

    const [host] = await db(this.tableName)
      .insert({
        user_id: userId,
        company_name: data.companyName,
        host_type: 'operator',
        tax_id: data.taxId,
        address: data.address,
        website: data.website,
        contact_person: data.contactPerson || null,
        company_phone: data.phoneNumber || null,
        company_address: data.address || null,
        bank_iban: data.bankIban || null,
        mwst_number: data.mwstNumber || null,
        commission_rate: data.commissionRate ?? 19,
        facility_options: facilityOptions,
        transfer_service: data.transferService ? JSON.stringify(data.transferService) : '{}',
        photos: data.photos ? JSON.stringify(data.photos) : '[]',
        verification_status: VerificationStatus.PENDING,
        documents_verified: false,
        rejection_reason: null,
      })
      .returning('*');

    // Keep user role as customer until admin approval.
    await db('users')
      .where('id', userId)
      .whereNot('role', UserRole.ADMIN)
      .update({ role: UserRole.CUSTOMER, updated_at: new Date() });

    const user = await db('users').where('id', userId).select('email', 'name').first();
    if (user?.email) {
      await emailService.sendHostRegistrationPendingEmail({
        email: user.email,
        firstName: user.name?.split(' ')[0] || user.name || 'Host',
      });
    }

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

    // Map camelCase input to snake_case DB columns
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.companyName !== undefined) updateData.company_name = data.companyName;
    if (data.taxId !== undefined) updateData.tax_id = data.taxId;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.contactPerson !== undefined) updateData.contact_person = data.contactPerson;
    if (data.phoneNumber !== undefined) updateData.company_phone = data.phoneNumber;
    if (data.bankIban !== undefined) updateData.bank_iban = data.bankIban;
    if (data.mwstNumber !== undefined) updateData.mwst_number = data.mwstNumber;
    if (data.commissionRate !== undefined) updateData.commission_rate = data.commissionRate;
    if (data.facilityOptions !== undefined) {
      updateData.facility_options = Array.isArray(data.facilityOptions)
        ? JSON.stringify(Object.fromEntries(data.facilityOptions.map((item) => [item, true])))
        : JSON.stringify(data.facilityOptions);
    }
    if (data.transferService !== undefined) updateData.transfer_service = JSON.stringify(data.transferService);
    if (data.photos !== undefined) updateData.photos = JSON.stringify(data.photos);

    const [updated] = await db(this.tableName)
      .where('id', id)
      .update(updateData)
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
    page?: number;
    limit?: number;
  }): Promise<{ hosts: Host[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db(this.tableName);

    if (status) {
      query = query.where('verification_status', status);
    }

    const [{ count }] = await query.clone().count('* as count');
    const total = Number.parseInt(count as string, 10);

    const hosts = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { hosts, total };
  }

  async getByIdWithUser(id: string): Promise<Host & { user: unknown }> {
    return this.getWithUser(id);
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
