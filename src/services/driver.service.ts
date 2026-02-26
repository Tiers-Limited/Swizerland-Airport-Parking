import { db } from '../database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { hashPassword, generateRandomToken } from '../utils/auth.utils';
import { emailService } from './email.service';

// ─── Types ──────────────────────────────────────────────────────────

export interface CreateDriverInput {
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseExpiry: string;
}

// ─── Driver Service ─────────────────────────────────────────────────

export class DriverService {

  /** Admin: create a driver user + profile. */
  async createDriver(input: CreateDriverInput): Promise<Record<string, unknown>> {
    const existing = await db('users').where('email', input.email).first();
    if (existing) throw new ValidationError('A user with this email already exists');

    const tempPassword = generateRandomToken(12);
    const passwordHash = await hashPassword(tempPassword);

    return db.transaction(async (trx) => {
      const [user] = await trx('users')
        .insert({
          email: input.email,
          name: input.name,
          phone: input.phone,
          role: 'driver',
          password_hash: passwordHash,
          status: 'active',
          email_verified: false,
        })
        .returning('*');

      const [profile] = await trx('driver_profiles')
        .insert({
          user_id: user.id,
          license_number: input.licenseNumber,
          license_expiry: new Date(input.licenseExpiry),
          verification_status: 'pending',
          documents_verified: false,
        })
        .returning('*');

      // Send credentials email
      try {
        await emailService.sendEmail({
          to: input.email,
          subject: 'Ihr Fahrer-Konto wurde erstellt',
          html: `<p>Hallo ${input.name},</p>
            <p>Ihr Fahrer-Konto wurde erstellt. Ihre Anmeldedaten:</p>
            <p>E-Mail: <strong>${input.email}</strong><br/>
            Passwort: <strong>${tempPassword}</strong></p>
            <p>Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.</p>`,
        });
      } catch {
        // Non-critical
      }

      return { ...user, profile, password_hash: undefined };
    });
  }

  /** List all driver profiles with user info. */
  async listDrivers(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ drivers: Record<string, unknown>[]; total: number }> {
    const { status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = db('driver_profiles')
      .leftJoin('users', 'users.id', 'driver_profiles.user_id');

    if (status) query = query.where('driver_profiles.verification_status', status);
    if (search) {
      query = query.where(function () {
        this.whereILike('users.name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`)
          .orWhereILike('driver_profiles.license_number', `%${search}%`);
      });
    }

    const countResult = await query.clone().clearSelect().count('driver_profiles.id as count').first();
    const drivers = await query
      .select(
        'driver_profiles.*',
        'users.name',
        'users.email',
        'users.phone',
        'users.status as user_status'
      )
      .orderBy('driver_profiles.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { drivers, total: Number(countResult?.count ?? 0) };
  }

  /** Get a single driver profile. */
  async getDriver(driverProfileId: string): Promise<Record<string, unknown>> {
    const driver = await db('driver_profiles')
      .leftJoin('users', 'users.id', 'driver_profiles.user_id')
      .where('driver_profiles.id', driverProfileId)
      .select(
        'driver_profiles.*',
        'users.name',
        'users.email',
        'users.phone',
        'users.status as user_status'
      )
      .first();

    if (!driver) throw new NotFoundError('Driver profile');
    return driver;
  }

  /** Get driver by user ID. */
  async getDriverByUserId(userId: string): Promise<Record<string, unknown>> {
    const driver = await db('driver_profiles')
      .leftJoin('users', 'users.id', 'driver_profiles.user_id')
      .where('driver_profiles.user_id', userId)
      .select(
        'driver_profiles.*',
        'users.name',
        'users.email',
        'users.phone',
        'users.status as user_status'
      )
      .first();

    if (!driver) throw new NotFoundError('Driver profile');
    return driver;
  }

  /** Admin: approve or reject a driver. */
  async updateVerificationStatus(
    driverProfileId: string,
    status: 'approved' | 'rejected',
    documentsVerified?: boolean
  ): Promise<Record<string, unknown>> {
    const profile = await db('driver_profiles').where('id', driverProfileId).first();
    if (!profile) throw new NotFoundError('Driver profile');

    const updateData: Record<string, unknown> = {
      verification_status: status,
      updated_at: new Date(),
    };
    if (documentsVerified !== undefined) {
      updateData.documents_verified = documentsVerified;
    }

    const [updated] = await db('driver_profiles')
      .where('id', driverProfileId)
      .update(updateData)
      .returning('*');

    return updated;
  }

  /** Update driver profile fields. */
  async updateDriver(
    driverProfileId: string,
    updates: { licenseNumber?: string; licenseExpiry?: string }
  ): Promise<Record<string, unknown>> {
    const profile = await db('driver_profiles').where('id', driverProfileId).first();
    if (!profile) throw new NotFoundError('Driver profile');

    const data: Record<string, unknown> = { updated_at: new Date() };
    if (updates.licenseNumber) data.license_number = updates.licenseNumber;
    if (updates.licenseExpiry) data.license_expiry = new Date(updates.licenseExpiry);

    const [updated] = await db('driver_profiles')
      .where('id', driverProfileId)
      .update(data)
      .returning('*');

    return updated;
  }
}

export const driverService = new DriverService();
